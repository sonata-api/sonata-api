import type { CollectionDocument, RemovePayload, OptionalId } from '@sonata-api/types'
import type { Context } from '../types'
import { left, unsafe } from '@sonata-api/common'
import { traverseDocument, cascadingRemove } from '../collection'

export const remove = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(
  payload: RemovePayload<TDocument>,
  context: TContext extends Context<infer Description>
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

  await cascadingRemove(target, context)
  return context.model.findOneAndDelete(filters)
}
