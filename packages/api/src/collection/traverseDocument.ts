import type { Description, Property, Either } from '@sonata-api/types'
import type { ACErrors } from '@sonata-api/types'
import { ObjectId } from 'mongodb'
import { left, right, isLeft, unwrapEither, pipe, isReference } from '@sonata-api/common'
import { getCollectionAsset } from '../assets'
import {
  validateProperty,
  validateWholeness,
  makeValidationError,
  ValidationErrorCodes,
  type ValidationError

} from '@sonata-api/validation'

export type TraverseOptions = {
  autoCast?: boolean
  getters?: boolean
  validate?: boolean
  validateRequired?: string[]
  fromProperties?: boolean
  allowOperators?: boolean
  recurseReferences?: boolean
}

export type TraversePipe = {
  pipe?: (
    value: any,
    target: any,
    propName: string,
    property: Property,
    options: TraverseOptions
  ) => any
}

const getProperty = (propertyName: Lowercase<string>, parentProperty: Property | Description) => {
  if( propertyName === '_id' ) {
    return <Property>{
      type: 'string'
    }
  }

  if( 'items' in parentProperty && 'properties' in parentProperty.items ) {
    const property = parentProperty.items.properties?.[propertyName]
    if( property ) {
      return property
    }
  }

  if( 'additionalProperties' in parentProperty ) {
    return parentProperty.additionalProperties
  }

  if( '$id' in parentProperty ) {
    return parentProperty.properties?.[propertyName]
  }

  if( 'properties' in parentProperty ) {
    return parentProperty.properties?.[propertyName]
  }
}

const autoCast = (value: any, target: any, propName: string, property: Property, options?: TraverseOptions): any => {
  switch( typeof value ) {
    case 'boolean': {
      return !!value
    }

    case 'string': {
      if( isReference(property) ) {
        return ObjectId.isValid(value)
          ? new ObjectId(value)
          : value
      }

      if( 'format' in property ) {
        if( property.format === 'date' || property.format === 'date-time' ) {
          const timestamp = Date.parse(value)
          return !Number.isNaN(timestamp)
            ? new Date(timestamp)
            : null
        }
      }

      return value
    }

    case 'number': {
      if( 'format' in property ) {
        if( property.format === 'date' || property.format === 'date-time' ) {
          return new Date(value)
        }
      }
    }

    case 'object': {
      if( !value || value instanceof ObjectId ) {
        return value
      }

      if( Array.isArray(value) ) {
        return value.map((v) => autoCast(v, target, propName, property, options))
      }

      if( Object.keys(value).length > 0 ) {
        const entries: [string, any][] = []
        for( const [k, v] of Object.entries(value) ) {
          const subProperty = !k.startsWith('$')
            ? getProperty(k as Lowercase<string>, property)
            : property

          if( !subProperty ) {
            continue
          }

          entries.push([
            k,
            autoCast(v, target, propName, subProperty, options)
          ])
        }

        return Object.fromEntries(entries)
      }
    }
  }

  return value
}

const getters = (value: any, target: any, _propName: string, property: Property) => {
  if( property.getter ) {
    return property.getter(target)
  }

  return value
}

const validate = (value: any, _target: any, propName: string, property: Property) => {
  const error = validateProperty(propName as Lowercase<string>, value, property)

  if( error ) {
    return left({
      [propName]: error
    })
  }

  return value
}

const recurse = async <TRecursionTarget extends Record<Lowercase<string>, any>>(
  target: TRecursionTarget,
  parent: Property | Description,
  options: TraverseOptions & TraversePipe

): Promise<Either<ValidationError | ACErrors, TRecursionTarget>> => {
  const entries = []
  const entrypoint = options.fromProperties && 'properties' in parent
    ? { _id: null, ...parent.properties }
    : target

  if( !parent ) {
    return right({} as TRecursionTarget)
  }

  for( const key in entrypoint ) {
    const value = target[key as keyof typeof target]
    if( value === undefined && !options?.getters ) {
      continue
    }

    if( options.autoCast && key === '_id' ) {
      entries.push([
        key,
        autoCast(value, target, key, { $ref: '', isReference: true }, {})
      ])
      continue
    }

    const property = getProperty(key as Lowercase<string>, parent)

    if( !property && value && (value.constructor === Object || value.constructor === Array) ) {
      // if first key is preceded by '$' we assume
      // it contains MongoDB query operators
      if( Object.keys(value)[0]?.startsWith('$') ) {
        if( options.allowOperators ) {
          entries.push([
            key,
            value
          ])
        }

        continue
      }

      if( Array.isArray(value) ) {
        const operations = []
        for( const operation of value ) {
          const operatorEither = await recurse(operation, parent, options)
          if( isLeft(operatorEither) ) {
            return left(unwrapEither(operatorEither))
          }

          operations.push(unwrapEither(operatorEither))
        }

        entries.push([
          key,
          operations
        ])
        continue
      }

      const operatorEither = await recurse(value, parent, options)
      if( isLeft(operatorEither) ) {
        return left(unwrapEither(operatorEither))
      }

      entries.push([
        key,
        unwrapEither(operatorEither)
      ])
    }

    if( property ) {
      if( options.recurseReferences ) {
        const propCast = property as Property
        if( propCast.isReference && value && !(value instanceof ObjectId) ) {
          const targetDescriptionEither = await getCollectionAsset(propCast.referencedCollection!, 'description')
          if( isLeft(targetDescriptionEither) ) {
            return left(unwrapEither(targetDescriptionEither))
          }

          const targetDescription = unwrapEither(targetDescriptionEither)
          if( Array.isArray(value) ) {
            const documents = []

            for( const elem of value ) {
              const documentEither = await traverseDocument(elem, targetDescription, options)
              if( isLeft(documentEither) ) {
                return left(unwrapEither(documentEither))
              }

              documents.push(unwrapEither(documentEither))
            }

            entries.push([
              key,
              documents
            ])
            continue
          }

          const documentEither = await traverseDocument(value, targetDescription, options)
          if( isLeft(documentEither) ) {
            return left(unwrapEither(documentEither))
          }

          entries.push([
            key,
            unwrapEither(documentEither)
          ])
          continue
        }
      }

      entries.push([
        key,
        await options.pipe!(value, target, key, property, options)
      ])
    }
  }

  return right(Object.fromEntries(entries))
}

export const traverseDocument = async <const TWhat extends Record<string, any>>(
  what: TWhat,
  description: Description,
  options: TraverseOptions & TraversePipe
) => {
  const functions = []
  let validationError: ValidationError | null = null

  if( Object.keys(what).length === 0 ) {
    return right({})
  }

  if( options.autoCast ) {
    functions.push(autoCast)
  }

  if( options.getters ) {
    functions.push(getters)
  }

  if( options.validate ) {
    const descriptionCopy = Object.assign({}, description)
    if( options.validateRequired ) {
      descriptionCopy.required = options.validateRequired
    }

    const wholenessError = validateWholeness(what, descriptionCopy)
    if( wholenessError ) {
      return left(wholenessError)
    }

    functions.push(validate)
  }

  options.pipe = pipe(functions, {
    returnFirst: (value) => {
      if( value?._tag === 'Left' ) {
        validationError = value.value
        return value
      }
    }
  })

  const resultEither = await recurse(what, description, options)
  if( isLeft(resultEither) ) {
    return left(unwrapEither(resultEither))
  }

  return validationError
    ? left(makeValidationError({
      code: ValidationErrorCodes.InvalidProperties,
      errors: validationError
    }))
    : right(unwrapEither(resultEither) as any)
}
