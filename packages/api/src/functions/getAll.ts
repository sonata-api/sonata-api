import type { Context, MongoDocument } from '../types'
import type { Filters, Projection, QuerySort } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '..'
import { LEAN_OPTIONS, DEFAULT_SORT } from '../constants'
import { normalizeProjection } from '../collection/utils'

export const getAll = <TDocument extends MongoDocument>() => async (payload: {
  filters?: Filters<TDocument>
  project?: Projection<TDocument>
  offset?: number
  limit?: number
  sort?: QuerySort<TDocument>
}, context: Context<any, Collections, Algorithms>) => {
  const accessControl = useAccessControl(context)

  const {
    filters = {},
    project = {},
    offset = 0,
    limit = process.env.PAGINATION_LIMIT || 35,
  } = payload || {}


  const entries = Object.entries(filters)
    .map(([key, value]) => [
      key,
      value && typeof value === 'object' && '_id' in value ? value._id : value
    ])

  const parsedFilters = Object.fromEntries(entries) || {}
  const query = unsafe(await accessControl.beforeRead({
    ...payload,
    filters: parsedFilters
  }))

  const sort = payload?.sort
    ? payload.sort
    : query.sort || DEFAULT_SORT

  return context.model.find(query.filters, normalizeProjection(project, context.description))
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .lean(LEAN_OPTIONS) as Promise<Array<TDocument>>
}
