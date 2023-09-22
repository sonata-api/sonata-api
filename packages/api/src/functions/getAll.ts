import type { Context, MongoDocument } from '../types'
import type { Filters, Projection, QuerySort } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import { LEAN_OPTIONS, DEFAULT_SORT } from '../constants'
import { normalizeProjection, fill } from '../collection/utils'

export const getAll = <TDocument extends MongoDocument>() => async (payload: {
  filters?: Filters<TDocument>
  project?: Projection<TDocument>
  offset?: number
  limit?: number
  sort?: QuerySort<TDocument>
}, context: Context<any, Collections, Algorithms>) => {
  const accessControl = useAccessControl(context)

  const entries = Object.entries(payload.filters || {})
    .map(([key, value]) => [
      key,
      value && typeof value === 'object' && '_id' in value
        ? value._id
        : value
    ])

  const newPayload = Object.assign({}, payload)
  newPayload.filters = Object.fromEntries(entries)

  const query = unsafe(await accessControl.beforeRead(newPayload))

  const {
    limit,
    sort = DEFAULT_SORT,
    project,
    offset

  } = query

  const result = await context.model.find(query.filters, normalizeProjection(project, context.description))
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .lean(LEAN_OPTIONS) as Array<TDocument>

  return result.map((result) => fill(result, context.description))
}
