import type { Context, OptionalId } from '../types'
import type { CollectionDocument, Filters } from './types'
import { unsafe } from '@sonata-api/common'
import { traverseDocument } from '../collection'

export const removeAll = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(payload: {
  filters: Filters<TDocument>
}, context: TContext extends Context<infer Description>
  ? TContext
  : never
) => {
  const filters = {
    ...payload.filters,
    _id: {
      $in: payload.filters._id
    }
  }

  return context.model.deleteMany(unsafe(await traverseDocument(filters as any, context.description, {
    autoCast: true
  })))
}
