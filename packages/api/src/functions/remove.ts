import type { Context, OptionalId } from '../types'
import type { Filters } from './types'

export const remove = <TDocument extends OptionalId<any>>() => <TContext>(payload: {
  filters: Filters<TDocument>
}, context: TContext extends Context<infer Description>
  ? TContext
  : never
) => {
  if( !payload.filters._id ) {
    throw new Error('you must pass an _id as filter')
  }

  return context.model.findOneAndDelete(payload.filters)
}
