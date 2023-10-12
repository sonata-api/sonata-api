import type { Description, CollectionProperty } from '@sonata-api/types'
import type { ACErrors } from '@sonata-api/access-control'
import { ObjectId } from 'mongodb'
import { left, right, isLeft, unwrapEither, getReferencedCollection, pipe, type Either } from '@sonata-api/common'
import { getResourceAsset } from '../assets'
import { preloadDescription } from './preload'
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
  pipe?: (
    value: any,
    target: any,
    propName: string,
    property: CollectionProperty,
    options: TraverseOptions
  ) => any
}

const getProperty = (propertyName: string, parentProperty: CollectionProperty) => {
  if( propertyName === '_id' ) {
    return <CollectionProperty>{
      type: 'string'
    }
  }

  return parentProperty.properties?.[propertyName]
    || parentProperty.items?.properties?.[propertyName]
    || parentProperty.additionalProperties
}

const autoCast = async (value: any, target: any, propName: string, property: CollectionProperty, options: TraverseOptions): Promise<any> => {
  switch( typeof value ) {
    case 'string': {
      if( property.s$isReference ) {
        return ObjectId.isValid(value)
          ? new ObjectId(value)
          : value
      }

      if( property.format === 'date' || property.format === 'date-time' ) {
        const timestamp = Date.parse(value)
        return !Number.isNaN(timestamp)
          ? new Date(timestamp)
          : null
      }

      return value
    }

    case 'object': {
      if( !value ) {
        return value
      }

      if( Array.isArray(value) ) {
        return Promise.all(value.map((v) => autoCast(v, target, propName, property, options)))
      }

      if( Object.keys(value).length > 0 ) {
        const entries: Array<any> = []
        for( const [k, v] of Object.entries(value) ) {
          const subProperty = getProperty(k, property)
          if( !subProperty ) {
            return value
          }

          entries.push([
            k,
            await autoCast(v, target, propName, subProperty, options)
          ])
        }

        return Object.fromEntries(entries)
      }
    }
  }

  return value
}

const getters = (value: any, target: any, _propName: string, property: CollectionProperty) => {
  if( property.s$getter ) {
    return property.s$getter(target)
  }

  return value
}

const validate = async (value: any, _target: any, propName: string, property: CollectionProperty) => {
  const error = await validateProperty(propName as Lowercase<string>, value, property)
  if( error ) {
    return left({
      [propName]: error
    })
  }

  return value
}

const recurse = async <TRecursionTarget extends Record<Lowercase<string>, any>>(
  target: TRecursionTarget,
  parent: CollectionProperty | undefined,
  options: TraverseOptions

): Promise<Either<ValidationError | ACErrors, TRecursionTarget>> => {
  const entries = []
  const entrypoint = options.fromProperties
    ? { _id: null, ...parent!.properties! }
    : target

  if( !parent ) {
    return right({} as TRecursionTarget)
  }

  for( const key in entrypoint ) {
    const value = target[key as keyof typeof target]
    if( !value ) {
      continue
    }

    if( options.autoCast && key === '_id' ) {
      entries.push([
        key,
        new ObjectId(value)
      ])
      continue
    }

    const property = getProperty(key, parent)

    if( !property && value && typeof value === 'object' ) {
      // if first key is preceded by '$' we assume
      // it contains MongoDB query operators
      if( options.allowOperators && Object.keys(value)[0].startsWith('$') ) {
        entries.push([
          key,
          value
        ])
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

      const operatorEither = await recurse(value as any, parent, options)
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
        const propCast = property as CollectionProperty
        if( propCast.s$isReference && value && !(value instanceof ObjectId) ) {
          const targetDescriptionEither = await getResourceAsset(propCast.s$referencedCollection!, 'description')
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

          const documentEither = await traverseDocument(value as any, targetDescription, options)
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
  options: TraverseOptions
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

    const wholenessError = validateWholeness(descriptionCopy, what)
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

  const resultEither = await recurse(what, await preloadDescription(description), options)
  if( isLeft(resultEither) ) {
    return left(unwrapEither(resultEither))
  }

  const result = unwrapEither(resultEither)

  return validationError
    ? left(makeValidationError({
      code: ValidationErrorCodes.InvalidProperties,
      errors: validationError
    }))
    : right(result)
}
