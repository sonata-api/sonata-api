import type { CollectionProperty } from '@sonata-api/types'

export const getReferencedCollection = (property?: CollectionProperty) => {
  const search = [
    property?.items,
    property?.additionalProperties,
    property
  ]

  const reference = search.find((_) => !!_)
  return reference?.$ref
    ? { ...property, ...reference }
    : null
}
