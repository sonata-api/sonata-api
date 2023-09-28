import type { Context, OptionalId } from '../types'
import type { Filters } from './types'

export const removeAll = <TDocument extends OptionalId<any>>() => <TContext>(payload: {
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

  return context.model.deleteMany(filters as any)
}
