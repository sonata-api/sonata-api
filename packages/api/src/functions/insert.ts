import type { Context, SchemaWithId, InsertPayload, ObjectId } from '@sonata-api/types'
import { useAccessControl } from '@sonata-api/access-control'
import { left, right, isLeft, unwrapEither, unsafe } from '@sonata-api/common'
import { traverseDocument, normalizeProjection, prepareInsert } from '../collection'

export const insert = async <
  TContext extends Context,
  TDocument = SchemaWithId<TContext['description']>,
>(
  payload: InsertPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
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
      : context.description.required,
  })

  if( isLeft(whatEither) ) {
    const error = unwrapEither(whatEither)
    return left(error)
  }

  const what = unwrapEither(whatEither)

  const docId = '_id' in what
    ? what._id
    : null

  const readyWhat = prepareInsert(what, context.description)
  const projection = payload.project
    ? normalizeProjection(payload.project, context.description)
    : {}

  let newId: ObjectId = docId

  if( !newId ) {
    const now = new Date()
    Object.assign(readyWhat, {
      created_at: now,
      updated_at: now,
    })

    newId = (await context.collection.model.insertOne(readyWhat)).insertedId

  } else {
    readyWhat.$set ??= {}
    readyWhat.$set.updated_at = new Date()
    await context.collection.model.updateOne({
      _id: docId,
    }, readyWhat)

  }

  if( context.collection.originalFunctions.get ) {
    return right(await context.collection.originalFunctions.get({
      filters: {
        _id: docId,
      },
    }, context, {
      bypassAccessControl: true,
    }) as TDocument)
  }

  const result = await context.collection.model.findOne({
    _id: docId,
  }, {
    projection,
  })

  /* eslint-disable-next-line */
  return right(unsafe(await traverseDocument(result!, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true,
  })))
}
