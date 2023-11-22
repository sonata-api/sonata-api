import type { Context, OptionalId } from '../types'
import type { CollectionDocument, Filters, Projection, QuerySort } from './types'
import type { Document } from 'mongodb'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import {
  traverseDocument,
  normalizeProjection,
  getReferences,
  buildLookupPipeline,
  fill
} from '../collection'

export type GetAllOptions = {
  bypassAccessControl?: boolean
}

export const getAll = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(
  _payload: {
    filters?: Filters<TDocument>
    project?: Projection<TDocument>
    offset?: number
    limit?: number
    sort?: QuerySort<TDocument>
  } | null,
  context: TContext extends Context<infer Description>
    ? TContext
    : never,
  options?: GetAllOptions
) => {
  const accessControl = useAccessControl(context)
  const payload = _payload || {}

  const {
    filters = {},
    limit = 0,
    sort,
    project = [],
    offset = 0

  } = !options?.bypassAccessControl
    ? unsafe(await accessControl.beforeRead(payload))
    : payload

  const { $text, ...filtersRest } = filters

  const pipeline: Document[] = []
  const references = await getReferences(context.description.properties, {
    memoize: context.description.$id
  })

  if( $text ) {
    pipeline.push({
      $match: {
        $text
      }
    })
  }

  if( sort ) {
    pipeline.push({ $sort: sort })
  }

  else if( context.description.timestamps !== false ) {
    pipeline.push({
      $sort: {
        _id: -1
      }
    })
  }

  if( Object.keys(filtersRest).length > 0 ) {
    pipeline.push({
      $match: unsafe(await traverseDocument(filtersRest, context.description, {
        autoCast: true,
        allowOperators: true
      }))
    })
  }

  pipeline.push({ $skip: offset })
  pipeline.push({ $limit: limit })
  const projection = normalizeProjection(project, context.description)
  if( projection ) {
    pipeline.push({ $project: projection })
  }

  pipeline.push(...buildLookupPipeline(references, {
    memoize: context.description.$id,
    project,
    properties: context.description.properties
  }))


  const result = await context.model.aggregate(pipeline).toArray()

  const documents: typeof result = []
  for( const document of result ) {
    documents.push(
      unsafe(await traverseDocument(fill(document, context.description), context.description, {
        getters: true,
        fromProperties: true,
        recurseReferences: true,
      }))
    )
  }

  return documents as TDocument[]
}
