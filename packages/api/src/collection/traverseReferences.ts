import type { Description, CollectionProperty } from '@sonata-api/types'
import { getReferencedCollection } from '@sonata-api/common'
import { ObjectId } from 'mongodb'

const getProperty = (propertyName: string, parentProperty: CollectionProperty) => {
  return parentProperty.properties?.[propertyName]
    || parentProperty.items?.properties?.[propertyName]
    || parentProperty.additionalProperties
}

const parse = (value: any, property: CollectionProperty): any => {
  switch( typeof value ) {
    case 'string': {
      return ObjectId.isValid(value) && getReferencedCollection(property)
        ? new ObjectId(value)
        : value
    }

    case 'object': {
      if( Array.isArray(value) ) {
        return value.map((v) => parse(v, property))
      }

      if( value instanceof Object ) {
        return recurse(value, property)
      }
    }
  }
}

const recurse = <TRecursionTarget extends Record<Lowercase<string>, any>>(target: TRecursionTarget, parent: CollectionProperty | undefined): TRecursionTarget => {
  return Object.fromEntries(Object.entries(target).map(([key, value]) => {
    if( !value || !parent ) {
      return [
        key,
        value
      ]
    }
    if( key === '_id' ) {
      return [
        key,
        new ObjectId(value)
      ]
    }

    const property = getProperty(key, parent)
    if( !property ) {
      return [
        key,
        value
      ]
    }

    // if first key is preceded by '$' we assume
    // it contains MongoDB query operators
    if( Object.keys(value)[0]?.startsWith('$') ) {
      return [
        key,
        Object.fromEntries(Object.entries(value).map(([k, v]) => {
          return [
            k,
            parse(v, property)
          ]
        }))
      ]
    }

    return [
      key,
      parse(value, property)
    ]
  })) as TRecursionTarget
}

export const traverseReferences = <const TWhat extends Record<string, any>>(what: TWhat, description: Description) => {
  return recurse(what, description)
}
