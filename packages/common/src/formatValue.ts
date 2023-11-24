import type { Property } from '@sonata-api/types'
import { formatDateTime } from './string'
import { getReferencedCollection } from '.'

export const formatValue = (value: any, key: string, property?: Property, index?: string): string => {
  if( Array.isArray(value) ) {
    return value.map(v => formatValue(v, key, property, index)).join(', ')
  }
  
  const firstValue = (() => {
    if( !property ) {
      return value
    }

    const refProperty = getReferencedCollection(property)
    if( refProperty ) {
      const firstIndex = index || refProperty.indexes?.[0]
      return firstIndex && value?.[firstIndex]
    }
    
    if( value instanceof Object ) {
      return Object.values(value)[0]
    }

    return value
  })()

  const formatted = (() => {
    if( !property ) {
      return firstValue
    }

    if( 'type' in property ) {
      if( property.type  === 'boolean' ) {
        return firstValue
          ? 'true'
          : false
      }
    }
    if( 'format' in property ) {
      if( ['date', 'date-time'].includes(property.format!) ) {
        return formatDateTime(String(value), property.format === 'date-time')
      }
    }

    if( [undefined, null].includes(firstValue) ) {
      return '-'
    }

    return firstValue
  })()

  return String(formatted)
}
