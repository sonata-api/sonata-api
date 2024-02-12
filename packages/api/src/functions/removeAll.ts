import type { Context, RemoveAllPayload } from '@sonata-api/types'
import { unsafe } from '@sonata-api/common'
import { traverseDocument, cascadingRemove } from '../collection/index.js'

export const removeAll = async <TContext extends Context>(payload: RemoveAllPayload, context: TContext) => {
  const filtersWithId = {
    ...payload.filters,
    _id: {
      $in: payload.filters,
    },
  }

  const filters = unsafe(await traverseDocument(filtersWithId, context.description, {
    autoCast: true,
  }))

  const it = context.collection.model.find(filters)

  let document: any
  while( document = await it.next() ) {
    await cascadingRemove(document, context)
  }

  return context.collection.model.deleteMany(filters)
}

