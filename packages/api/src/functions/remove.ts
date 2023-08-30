import type { Context, MongoDocument } from '../types'
import type { Filters } from './types'

export const remove = <TDocument extends MongoDocument>() => (payload: {
  filters: Filters<TDocument>
}, context: Context<any, Collections, Algorithms>) => {
  if( !payload.filters._id ) {
    throw new Error('you must pass an _id as filter')
  }

  return context.model.findOneAndDelete(payload.filters, {
    strict: 'throw'
  })
}
