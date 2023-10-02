import type { Description, CollectionProperty } from '@sonata-api/types'
import { ObjectId } from 'mongodb'
import { left, right, getReferencedCollection, pipe } from '@sonata-api/common'
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

const autoCast = (value: any, target: any, propName: string, property: CollectionProperty, options: TraverseOptions): any => {
  switch( typeof value ) {
    case 'string': {
      return ObjectId.isValid(value) && getReferencedCollection(property)
        ? new ObjectId(value)
        : value
    }

    case 'object': {
      if( Array.isArray(value) ) {
        return Promise.all(value.map((v) => autoCast(v, target, propName, property, options)))
      }

      if( value instanceof Object ) {
        return recurse(value, property, options)
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

): Promise<TRecursionTarget> => {
  const entries = []
  const entrypoint = options.fromProperties
    ? { _id: null, ...parent!.properties! }
    : target

  if( !parent ) {
    return {} as TRecursionTarget
  }

  for( const key in entrypoint ) {
    const value = target[key as keyof typeof target]

    if( options.autoCast && key === '_id' ) {
      entries.push([
        key,
        new ObjectId(value)
      ])
      continue
    }

    const property = getProperty(key, parent)
    if( !property ) {
      continue
    }

    if( value && typeof value === 'object' ) {
      // if first key is preceded by '$' we assume
      // it contains MongoDB query operators
      if( options.autoCast && Object.keys(value)[0]?.startsWith('$') ) {
        const operatorEntries = []
        for( const [k, v] of Object.entries(value) ) {
          operatorEntries.push([
            k,
            await options.pipe!(v, target, key, property, options)
          ])
        }

        entries.push([
          key,
          Object.fromEntries(operatorEntries)
        ])
        continue
      }
    }

    entries.push([
      key,
      await options.pipe!(value, target, key, property, options)
    ])
  }

  return Object.fromEntries(entries)
}

export const traverseDocument = async <const TWhat extends Record<string, any>>(
  what: TWhat,
  description: Description,
  options: TraverseOptions
) => {
  const functions = []
  let validationError: ValidationError | null = null

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

  const result = await recurse(what, description, options)

  return validationError
    ? left(makeValidationError({
      code: ValidationErrorCodes.InvalidProperties,
      errors: validationError
    }))
    : right(result)
}
