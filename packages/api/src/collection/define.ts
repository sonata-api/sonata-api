import type { SchemaWithId, Collection, Context, Description } from '@sonata-api/types'

export const defineCollection = <
  TCollection extends Collection<TCollection extends Collection ? TCollection : never> extends infer Coll
    ? Omit<Coll,
      | 'item'
      | 'description'
      | 'functions'
    >
    : never,
  const TDescription extends Description<TDescription> & {
    properties: Description['properties']
  },
  const TFunctions extends {
    [P: string]: (payload: any, context: Context<TDescription>, ...args: any[])=> any
  },
>(
  collection: TCollection & {
    description: TDescription
    functions?: TFunctions
  },
) => {
  return collection as TCollection & {
    item: SchemaWithId<TDescription>
    description: TDescription
    functions: TFunctions
  }
}

