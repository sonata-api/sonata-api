import type { Description, Property, Either, ACErrors, ValidationError } from '@sonata-api/types'
import { left, right, isLeft, unwrapEither, unsafe, pipe, isReference } from '@sonata-api/common'
import { validateProperty, validateWholeness, makeValidationError } from '@sonata-api/validation'
import { ValidationErrorCodes } from '@sonata-api/types'
import { ObjectId } from 'mongodb'
import { getCollectionAsset } from '../assets'
import { preloadDescription } from './preload'
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
  )=> any
}

const getProperty = (propertyName: string, parentProperty: Property | Description) => {
  if( propertyName === '_id' ) {
    return <Property>{
      type: 'string',
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

const autoCast = (
  value: any, target: any, propName: string, property: Property, options?: TraverseOptions,
): any => {
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
      if( 'type' in property && property.type === 'integer' ) {
        return parseInt(value.toString())
      }

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
        return value.map((v) => autoCast(
          v, target, propName, property, options,
        ))
      }

      if( Object.keys(value).length > 0 ) {
        const entries: [string, any][] = []
        for( const [k, v] of Object.entries(value) ) {
          const subProperty = !k.startsWith('$')
            ? getProperty(k, property)
            : property

          if( !subProperty ) {
            continue
          }

          entries.push([
            k,
            autoCast(
              v, target, propName, subProperty, options,
            ),
          ])
        }

        return Object.fromEntries(entries)
      }
    }
  }

  return value
}

const getters = (value: any, target: any, _propName: string, property: Property) => {
  if( 'getter' in property ) {
    return property.getter(target)
  }

  return value
}

const validate = (value: any, _target: any, propName: string, property: Property) => {
  const error = validateProperty(propName, value, property)

  if( error ) {
    return left({
      [propName]: error,
    })
  }

  return value
}

const recurse = async <TRecursionTarget extends Record<string, any>>(
  target: TRecursionTarget,
  parent: Property | Description,
  options: TraverseOptions & TraversePipe = {},

): Promise<Either<ValidationError | ACErrors, TRecursionTarget>> => {
  const entries = []
  const entrypoint = options.fromProperties && 'properties' in parent
    ? {
      _id: null,
      ...parent.properties,
    }
    : target

  if( !parent ) {
    return right({} as TRecursionTarget)
  }

  for( const propName in entrypoint ) {
    const value = target[propName]
    const property = getProperty(propName, parent)

    if( value === undefined && !(options.getters && property && 'getter' in property) ) {
      continue
    }

    if( options.autoCast && propName === '_id' ) {
      entries.push([
        propName,
        autoCast(
          value, target, propName, {
            $ref: '',
          }, {},
        ),
      ])
      continue
    }

    if( !property && value && (value.constructor === Object || value.constructor === Array) ) {
      // if first propName is preceded by '$' we assume
      // it contains MongoDB query operators
      if( Object.keys(value)[0]?.startsWith('$') ) {
        if( options.allowOperators ) {
          entries.push([
            propName,
            value,
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
          propName,
          operations,
        ])
        continue
      }

      const operatorEither = await recurse(value, parent, options)
      if( isLeft(operatorEither) ) {
        return left(unwrapEither(operatorEither))
      }

      entries.push([
        propName,
        unwrapEither(operatorEither),
      ])
    }

    if( property ) {
      if( options.recurseReferences ) {
        const propCast = 'items' in property
          ? property.items
          : property

        if( '$ref' in propCast && value && !(value instanceof ObjectId) ) {
          const targetDescription = await preloadDescription(unsafe(await getCollectionAsset(propCast.$ref, 'description')))

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
              propName,
              documents,
            ])
            continue
          }

          const documentEither = await traverseDocument(value, targetDescription, options)
          if( isLeft(documentEither) ) {
            return left(unwrapEither(documentEither))
          }

          entries.push([
            propName,
            unwrapEither(documentEither),
          ])
          continue
        }
      }

      entries.push([
        propName,
        await options.pipe!(
          value, target, propName, property, options,
        ),
      ])
    }
  }

  return right(Object.fromEntries(entries))
}

export const traverseDocument = async <const TWhat extends Record<string, any>>(
  what: TWhat,
  description: Description,
  options: TraverseOptions & TraversePipe,
) => {
  const functions = []
  let validationError: ValidationError | null = null

  if( !options.validate && Object.keys(what).length === 0 ) {
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
    },
  })

  const resultEither = await recurse(what, description, options)
  if( isLeft(resultEither) ) {
    return left(unwrapEither(resultEither))
  }

  return validationError
    ? left(makeValidationError({
      code: ValidationErrorCodes.InvalidProperties,
      errors: validationError,
    }))
    : right(unwrapEither(resultEither) as any)
}
