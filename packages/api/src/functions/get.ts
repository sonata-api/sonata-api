import type { Context, MongoDocument } from '../types'
import type { Filters, Projection } from './types'
import { normalizeProjection } from '../collection/utils'
import { LEAN_OPTIONS } from '../constants'

export const get = <TDocument extends MongoDocument>() => (payload: {
  filters?: Filters<TDocument>,
  project?: Projection<TDocument>
}, context: Context<any, Collections, Algorithms>) => {
  const {
    filters = {},
    project = {}
  } = payload

  return context.model.findOne(
    filters,
    normalizeProjection(project, context.description)
  ).lean(LEAN_OPTIONS) as Promise<TDocument|null>
}
