import type { Description } from '@sonata-api/types'

export const freshItem = (description: Pick<Description, 'properties' | 'freshItem'>) => {
  const item = Object.entries(description.properties).reduce((a, [key, property]) => {
    const value = (() => {
      if( '$ref' in property ) {
        return {}
      }

      if( 'type' in property ) {
        switch( property.type ) {
          case 'array': return []
          case 'object': return {}
          case 'boolean': return false
        }
      }

      return null
    })()

    if( value === null ) {
      return a
    }

    return {
      ...a,
      [key]: value,
    }
  }, {})

  if( description.freshItem ) {
    Object.assign(item, description.freshItem)
  }

  return item
}

