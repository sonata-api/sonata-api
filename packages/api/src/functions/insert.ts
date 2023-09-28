import type { Context, OptionalId, WithId } from '../types'
import type { Projection, What } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { isError, unpack } from '@sonata-api/common'
import { normalizeProjection, prepareInsert } from '../collection/utils'

export const insert = <TDocument extends OptionalId<any>>() => async <TContext>(payload: {
  what: What<WithId<TDocument>>,
  project?: Projection<TDocument>
}, context: TContext extends Context<infer Description>
  ? TContext
  : never
) => {
  const accessControl = useAccessControl(context)

  const queryEither = await accessControl.beforeWrite(payload)
  if( isError(queryEither) ) {
    const error = unpack(queryEither)
    throw new Error(error)
  }

  const { what } = unpack(queryEither)
  const { _id } = what

  const readyWhat = prepareInsert(what, context.description)

  const projection = payload.project
    ? normalizeProjection(payload.project, context.description)
    : {}

    if( !_id ) {
      const newDoc = await context.model.insertOne(readyWhat)
      return context.model.findOne({ _id: newDoc.insertedId }, projection)
    }

    const options = {
      new: true,
      runValidators: true,
      projection
    }

    return context.model.findOneAndUpdate({ _id }, readyWhat, options)
}
