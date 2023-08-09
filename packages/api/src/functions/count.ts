import type { Context, MongoDocument } from '../types'
import type { Filters } from './types'

export const count = <TDocument extends MongoDocument>() => async (
  payload: { filters?: Filters<TDocument> },
  context: Context<any, Collections, Algorithms>
) => {
  return context.model.countDocuments(payload.filters)
}
