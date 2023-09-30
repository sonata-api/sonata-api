import type { Description, CollectionProperty } from '@sonata-api/types'
import { getReferencedCollection, pipe } from '@sonata-api/common'
import { ObjectId } from 'mongodb'

export type TraverseOptions = {
  autoCast?: boolean
  getters?: boolean
  fromProperties?: boolean
  pipe?: (value: any, target: any, property: CollectionProperty, options: TraverseOptions) => any
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

const autoCast = (value: any, target: any, property: CollectionProperty, options: TraverseOptions): any => {
  switch( typeof value ) {
    case 'string': {
      return ObjectId.isValid(value) && getReferencedCollection(property)
        ? new ObjectId(value)
        : value
    }

    case 'object': {
      if( Array.isArray(value) ) {
        return value.map((v) => autoCast(v, target, property, options))
      }

      if( value instanceof Object ) {
        return recurse(value, property, options)
      }
    }
  }
}

const getters = (value: any, target: any, property: CollectionProperty): any => {
  if( property.s$getter ) {
    return property.s$getter(target)
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
            await options.pipe!(v, target, property, options)
          ])
        }

        entries.push([
          key,
          Object.entries(operatorEntries)
        ])
        continue
      }
    }

    entries.push([
      key,
      await options.pipe!(value, target, property, options)
    ])
  }

  return Object.fromEntries(entries)
}

export const traverseDocument = <const TWhat extends Record<string, any>>(
  what: TWhat,
  description: Description,
  options: TraverseOptions
) => {
  const functions = []
  if( options.autoCast ) {
    functions.push(autoCast)
  }

  if( options.getters ) {
    functions.push(getters)
  }

  options.pipe = pipe(functions)
  return recurse(what, description, options)
}
