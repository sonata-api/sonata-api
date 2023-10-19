import type { CollectionProperty } from '@sonata-api/types'
import { formatDateTime } from './string'

export const formatValue = (
  value: any,
  key: string,
  property?: CollectionProperty,
  index?: string
): string => {
  if( Array.isArray(value) ) {
    return value.map(v => formatValue(v, key, property, index)).join(', ')
  }
  
  const firstValue = (() => {
    if( property?.s$isReference ) {
      const firstIndex = index || property.s$indexes?.[0]
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
