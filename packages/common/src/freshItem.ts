import type { Description } from '@sonata-api/types'

export const freshItem = (description: Pick<Description, 'properties' | 'freshItem'>) => {
  const item: Record<string, any> = Object.entries(description.properties).reduce((a, [key, property]) => {
    const value = (() => {
      if( property.$ref ) {
        return {}
      }

      switch( property.type ) {
        case 'array': return []
        case 'object': return {}
        default: return null
      }
    })()

    if( !value ) {
      return a
    }

    return {
      ...a,
      [key]: value
    }
  }, {})

  if( description.freshItem ) {
    Object.assign(item, description.freshItem)
  }

  return item
}

