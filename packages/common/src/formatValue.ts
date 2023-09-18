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
    switch(true) {
      case ['date', 'date-time'].includes(property?.format!):
        return formatDateTime(String(value), property!.format === 'date-time')

      case property?.type === 'boolean': return firstValue ? 'true' : 'false'
      case [undefined, null].includes(firstValue): return '-'
      default: return firstValue
    }
  })()

  return String(formatted)
}
