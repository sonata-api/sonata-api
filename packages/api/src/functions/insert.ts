import type { Context, OptionalId, WithId } from '../types'
import type { Document, Projection, What } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { isError, unpack } from '@sonata-api/common'
import { traverseDocument, normalizeProjection, prepareInsert } from '../collection'

export const insert = <TDocument extends Document<OptionalId<any>>>() => async <TContext>(payload: {
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

  const query = unpack(queryEither)
  const what = await traverseDocument(query.what, context.description, {
    autoCast: true
  })

  const _id = '_id' in what
    ? what._id
    : null

  const readyWhat = prepareInsert(what, context.description)

  const projection = payload.project
    ? normalizeProjection(payload.project, context.description)
    : {}

  if( !_id ) {
    const now = new Date()
    Object.assign(readyWhat, {
      created_at: now,
      updated_at: now,
    })

    const newDoc = await context.model.insertOne(readyWhat)
    const result = context.model.findOne({ _id: newDoc.insertedId }, projection)

    return traverseDocument(result, context.description, {
      autoCast: true
    })
  }

  readyWhat.$set.updated_at = new Date()
  return context.model.findOneAndUpdate({ _id }, readyWhat, {
    returnDocument: 'after',
    projection
  })
}
