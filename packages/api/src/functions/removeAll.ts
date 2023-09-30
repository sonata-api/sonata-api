import type { Context, OptionalId } from '../types'
import type { Filters } from './types'
import { traverseDocument } from '../collection'

export const removeAll = <TDocument extends OptionalId<any>>() => async <TContext>(payload: {
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

  return context.model.deleteMany(await traverseDocument(filters as any, context.description, {
    autoCast: true
  }))
}
