import type { Collection } from '@sonata-api/types'

export const defineCollection = <const TCollection extends Collection<Awaited<ReturnType<TCollection>>>>(collection: TCollection) => {
  return collection
}

export const defineCollections = <const TCollections extends Record<string, Collection>>(collections: TCollections) => {
  return collections
}
