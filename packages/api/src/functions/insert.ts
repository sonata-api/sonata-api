import type { Context, MongoDocument } from '../types'
import type { Projection, What } from './types'
import { LEAN_OPTIONS } from '../constants'
import { useAccessControl } from '@sonata-api/access-control'
import { isError, unpack } from '..'
import { normalizeProjection, prepareInsert } from '../collection/utils'

export const insert = <TDocument extends MongoDocument>() => async (payload: {
  what: What<TDocument>,
  project?: Projection<TDocument>
}, context: Context<any, Collections, Algorithms>) => {
  const accessControl = useAccessControl(context)

  const queryEither = await accessControl.beforeWrite(payload)
  if( isError(queryEither) ) {
    const error = unpack(queryEither)
    throw new Error(error)
  }

  const { what } = payload
  const { _id } = what

  const readyWhat = prepareInsert(what, context.description)
  const projection = payload.project
    && normalizeProjection(payload.project, context.description)

  if( !_id ) {
    const newDoc = await context.model.create(readyWhat)
    return context.model.findOne({ _id: newDoc._id }, projection)
    .lean(LEAN_OPTIONS)
  }

  const options = {
    new: true,
    runValidators: true,
    projection
  }

  return context.model.findOneAndUpdate({ _id }, readyWhat, options)
    .lean(LEAN_OPTIONS) as Promise<TDocument>
}
