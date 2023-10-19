import type { CollectionProperty } from '@sonata-api/types'

export const getReferencedCollection = (property: CollectionProperty) => {
  const search = [
    'items' in property
      ? property.items
      : null,
    'additionalProperties' in property
      ? property.additionalProperties
      : null,
    property
  ]

  const reference = search.find((_) => !!_)
  return reference && '$ref' in reference
    ? { ...property, ...reference }
    : null
}
