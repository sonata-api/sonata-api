import type { Collection } from '../types'

export const defineCollection = <const TCollection extends Collection>(collection: TCollection) => {
  return collection
}
