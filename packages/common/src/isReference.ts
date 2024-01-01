import type { Property, RefProperty, ArrayOfRefs } from '@sonata-api/types'

export const isReference = (property: Property): property is RefProperty | ArrayOfRefs => {
  return 'items' in property
    ? '$ref' in property.items
    : '$ref' in property
}

