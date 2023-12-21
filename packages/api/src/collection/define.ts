import type { SchemaWithId, Collection, Description } from '@sonata-api/types'

export const defineCollection = <
  TCollection extends Collection<TCollection, TDescription>,
  const TDescription extends Description
>(collection: TCollection & { description: TDescription }) => {
  return collection as TCollection & {
    item: SchemaWithId<TDescription>
  }
}

