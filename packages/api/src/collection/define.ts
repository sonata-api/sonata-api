import type { SchemaWithId, Collection } from '@sonata-api/types'

export const defineCollection = <TCollection extends Collection<TCollection>>(collection: TCollection) => {
  return collection as TCollection & {
    item: SchemaWithId<TCollection['description']>
  }
}

