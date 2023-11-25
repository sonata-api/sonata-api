import type { Property } from '@sonata-api/types'

export const checkForUndefined = (property: Property, propertyName: Lowercase<string>, what: Record<Lowercase<string>, any>) => {
  if( 'type' in property ) {
    switch( property.type ) {
      case 'boolean': return
      case 'number': return
    }
  }

  if( property.readOnly ) {
    return
  }

  return !what[propertyName]
}

