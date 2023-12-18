import type { Context, CollectionDocument, RemoveAllPayload, OptionalId } from '@sonata-api/types'
import { unsafe } from '@sonata-api/common'
import { traverseDocument, cascadingRemove } from '../collection'

export const removeAll = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(
  payload: RemoveAllPayload<TDocument>,
  context: TContext extends Context<infer Description>
    ? TContext
    : never
) => {
  const filtersWithId = {
    ...payload.filters,
    _id: {
      $in: payload.filters._id
    }
  }

  const filters = unsafe(await traverseDocument(filtersWithId as any, context.description, {
    autoCast: true
  }))

  for( const document of await context.model.find(filters).toArray() ) {
    await cascadingRemove(document, context)
  }

  return context.model.deleteMany(filters)
}
