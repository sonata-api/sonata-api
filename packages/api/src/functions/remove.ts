import type { Context, OptionalId } from '../types'
import type { CollectionDocument, Filters } from './types'
import { left, unsafe } from '@sonata-api/common'
import { traverseDocument, cascadingRemove } from '../collection'

export const remove = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(payload: {
  filters: Filters<TDocument>
}, context: TContext extends Context<infer Description>
  ? TContext
  : never
) => {
  if( !payload.filters._id ) {
    return left({
      message: 'you must pass an _id as filter'
    })
  }

  const filters = unsafe(await traverseDocument(payload.filters, context.description, {
    autoCast: true
  }))

  const target = await context.model.findOne(filters)
  if( !target ) {
    return left({
      message: 'target not found'
    })
  }

  await cascadingRemove(target, context.description)
  return context.model.findOneAndDelete(filters)
}
