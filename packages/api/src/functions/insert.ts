import type { Context, OptionalId, WithId } from '../types'
import type { CollectionDocument, Projection, What } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { left, isLeft, unwrapEither, unsafe } from '@sonata-api/common'
import { traverseDocument, normalizeProjection, prepareInsert } from '../collection'

export const insert = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(payload: {
  what: What<WithId<TDocument>>,
  project?: Projection<TDocument>
}, context: TContext extends Context<infer Description>
  ? TContext
  : never
) => {
  const accessControl = useAccessControl(context)

  const queryEither = await accessControl.beforeWrite(payload)
  if( isLeft(queryEither) ) {
    const error = unsafe(queryEither)
    throw new Error(error)
  }

  const query = unsafe(queryEither)
  const whatEither = await traverseDocument(query.what, context.description, {
    autoCast: true,
    validate: true,
    validateRequired: payload.what._id
      ? []
      : context.description.required as string[]
  })

  if( isLeft(whatEither) ) {
    const error = unwrapEither(whatEither)
    return left(error)
  }

  const what = unwrapEither(whatEither)

  const _id = '_id' in what
    ? what._id
    : null

  const readyWhat = prepareInsert(what, context.description)

  const projection = payload.project
    ? normalizeProjection(payload.project, context.description)
    : []

  if( !_id ) {
    const now = new Date()
    Object.assign(readyWhat, {
      created_at: now,
      updated_at: now,
    })

    const newDoc = await context.model.insertOne(readyWhat)
    const result = context.model.findOne({ _id: newDoc.insertedId }, { projection })

    return unsafe(await traverseDocument(result, context.description, {
      autoCast: true
    }))
  }

  readyWhat.$set ??= {}
  readyWhat.$set.updated_at = new Date()

  return context.model.findOneAndUpdate({ _id }, readyWhat, {
    returnDocument: 'after',
    projection
  })
}
