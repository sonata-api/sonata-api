import { ObjectId } from 'mongodb'
import { Description, CollectionProperty } from '@sonata-api/types'

export const getTypeConstructor = async (property: CollectionProperty, recurse: (description: Pick<Description, 'properties'>) => any): Promise<any> => {
  if( property.type === 'array' ) {
    const type = await getTypeConstructor(property.items!, recurse)
    return [type]
  }

  if( property.$ref ) {
    return property.s$noId
      ? Object
      : ObjectId
  }

  if( property.enum ) {
    const first = property.enum[0]
    return first?.constructor || String
  }

  if( property.additionalProperties ) {
    return [
      Map,
      await getTypeConstructor(property.additionalProperties, recurse)
    ]
  }

  if( property.properties ) {
    return recurse(property as Parameters<typeof recurse>[0])
  }

  switch( property.format ) {
    case 'date':
    case 'date-time':
      return Date
  }

  switch( property.type ) {
    case 'string':
      return String
    case 'number':
    case 'integer':
      return Number
    case 'boolean':
      return Boolean
    case 'object':
      return Object
  }
}
