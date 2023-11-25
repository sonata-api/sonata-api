import type { Property } from '@sonata-api/types'

export const checkForUndefined = (property: Property, propertyName: Lowercase<string>, what: Record<Lowercase<string>, any>) => {
  if( ('type' in property && property.type === 'boolean') || property.readOnly ) {
    return
  }

  return what[propertyName] === undefined
}

