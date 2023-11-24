import type { Property, RefProperty, ArrayProperty } from '@sonata-api/types'

type ArrayOfRefs = Omit<ArrayProperty, 'items'> & {
  items: RefProperty
}

export const isReference = (property: Property): property is RefProperty | ArrayOfRefs => {
  return !!property.isReference
}

