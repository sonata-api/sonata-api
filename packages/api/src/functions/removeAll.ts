import type { Context, SchemaWithId, RemoveAllPayload } from '@sonata-api/types'
import { unsafe } from '@sonata-api/common'
import { traverseDocument, cascadingRemove } from '../collection'

export const removeAll = async <TContext extends Context>(
  payload: RemoveAllPayload<SchemaWithId<TContext['description']>>,
  context: TContext
) => {
  const filtersWithId = {
    ...payload.filters,
    _id: {
      $in: payload.filters._id
    }
  }

  const filters = unsafe(await traverseDocument(filtersWithId, context.description, {
    autoCast: true
  }))

  for( const document of await context.model.find(filters).toArray() ) {
    await cascadingRemove(document, context)
  }

  return context.model.deleteMany(filters)
}
