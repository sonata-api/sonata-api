import type { Property, RefProperty } from '@sonata-api/types'

export const isReference = (property: Property): property is RefProperty => {
  return !!property.isReference
}
