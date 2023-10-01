import type { Context, OptionalId } from '../types'
import type { Filters } from './types'
import { unsafe } from '@sonata-api/common'
import { traverseDocument } from '../collection'

export const remove = <TDocument extends OptionalId<any>>() => async <TContext>(payload: {
  filters: Filters<TDocument>
}, context: TContext extends Context<infer Description>
  ? TContext
  : never
) => {
  if( !payload.filters._id ) {
    throw new Error('you must pass an _id as filter')
  }


  return context.model.findOneAndDelete(unsafe(await traverseDocument(payload.filters, context.description, {
    autoCast: true
  })))
}
