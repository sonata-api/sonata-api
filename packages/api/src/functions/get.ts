import type { Context, OptionalId, WithId } from '../types'
import type { CollectionDocument, Filters, Projection } from './types'
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

export const get = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(payload: {
  filters?: Filters<TDocument>,
  project?: Projection<TDocument>
}, context: TContext extends Context<infer Description>
    ? TContext
    : never
) => {
  const accessControl = useAccessControl(context)

  const {
    filters = {},
    project = {}
  } = unsafe(await accessControl.beforeRead(payload))

  const pipeline: Document[] = []
  const references = getReferences(context.description.properties, {
    memoize: context.description.$id
  })

  pipeline.push({ $match: unsafe(await traverseDocument(filters, context.description, { autoCast: true })) })

  const projection = normalizeProjection(project, context.description)
  if( projection ) {
    pipeline.push({ $project: projection })
  }
  pipeline.push(...buildLookupPipeline(references, {
    memoize: context.description.$id
  }))

  const result = await context.model.aggregate(pipeline).next()
  if( !result ) {
    return null
  }

  return fill(
    unsafe(await traverseDocument(result, context.description, {
      getters: true,
      fromProperties: true
    })),
    context.description
  ) as WithId<TDocument>
}
