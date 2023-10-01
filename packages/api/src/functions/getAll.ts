import type { Context, OptionalId, WithId } from '../types'
import type { Document,Filters, Projection, QuerySort } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import { DEFAULT_SORT } from '../constants'
import { traverseDocument, normalizeProjection, fill } from '../collection'

export const getAll = <TDocument extends Document<OptionalId<any>>>() => async <TContext>(payload: {
  filters?: Filters<TDocument>
  project?: Projection<TDocument>
  offset?: number
  limit?: number
  sort?: QuerySort<TDocument>
}, context: TContext extends Context<infer Description>
  ? TContext
  : never
) => {
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

  const result = await context.model.find(unsafe(
    await traverseDocument(query.filters, context.description, { autoCast: true }), {
      projection: normalizeProjection(project, context.description)
  }))
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .toArray()

  const documents: typeof result = []
  for( const document of result ) {
    documents.push(
      unsafe(await traverseDocument(fill(document, context.description), context.description, {
        getters: true,
        fromProperties: true
      }))as WithId<TDocument>
    )
  }

  return documents
}
