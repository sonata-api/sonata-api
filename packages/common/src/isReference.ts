import type { Property, RefProperty, ArrayOfRefs } from '@sonata-api/types'

export const isReference = (property: Property): property is RefProperty | ArrayOfRefs => {
  return !!('items' in property
    ? property.items.isReference
    : property.isReference)
}

