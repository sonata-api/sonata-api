import type { CollectionDocument, InsertPayload, ObjectId } from '@sonata-api/types'
import type { Context } from '../types'
import { useAccessControl } from '@sonata-api/access-control'
import { left, right, isLeft, unwrapEither, unsafe } from '@sonata-api/common'
import { traverseDocument, normalizeProjection, prepareInsert } from '../collection'

export const insert = <TDocument extends CollectionDocument<any>>() => async <TContext>(
  payload: InsertPayload<TDocument>,
  context: TContext extends Context<infer Description>
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
    : {}

  let docId: ObjectId = _id

  if( !_id ) {
    const now = new Date()
    Object.assign(readyWhat, {
      created_at: now,
      updated_at: now,
    })

    docId = (await context.model.insertOne(readyWhat)).insertedId

  } else {
    readyWhat.$set ??= {}
    readyWhat.$set.updated_at = new Date()
    await context.model.updateOne({ _id }, readyWhat)

  }

  if( context.collection.$functions?.get ) {
    return right(await context.collection.$functions.get({
      filters: {
        _id: docId
      }
    }, context, { bypassAccessControl: true }) as TDocument)
  }

  const result = await context.model.findOne({ _id: docId }, { projection })
  return right(unsafe(await traverseDocument(result!, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true
  })) as TDocument)
}
