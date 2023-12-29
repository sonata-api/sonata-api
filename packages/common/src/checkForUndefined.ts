import type { Property } from '@sonata-api/types'

export const checkForUndefined = (property: Property, propertyName: Lowercase<string>, what: Record<Lowercase<string>, any>) => {
  if( property.readOnly || property.isTimestamp ) {
    return false
  }

  return what[propertyName] === null
    || what[propertyName] === undefined
}

