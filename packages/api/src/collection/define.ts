import type { Collection } from '../types'

export const defineCollection = <const TCollection extends Collection>(collection: TCollection) => {
  return collection
}

export const defineCollections = <const TCollections extends Record<string, Collection>>(collections: TCollections) => {
  return collections
}
