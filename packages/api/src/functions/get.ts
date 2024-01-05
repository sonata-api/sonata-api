import type { Context, SchemaWithId, GetPayload } from '@sonata-api/types'
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

export type GetOptions = {
  bypassAccessControl?: boolean
}

export const get = async <
  TContext extends Context,
  TDocument = SchemaWithId<TContext['description']>
>(
  payload: GetPayload<SchemaWithId<TContext['description']>>,
  context: TContext extends Context<infer Description>
    ? TContext
    : never,
  options?: GetOptions
) => {
  const accessControl = useAccessControl(context)

  const {
    filters = {},
    project = []
  } = !options?.bypassAccessControl
    ? unsafe(await accessControl.beforeRead(payload))
    : payload

  const pipeline: Document[] = []
  const references = await getReferences(context.description.properties, {
    memoize: context.description.$id
  })

  pipeline.push({
    $match: unsafe(await traverseDocument(filters, context.description, {
      autoCast: true,
      allowOperators: true
    }))
  })

  const projection = normalizeProjection(project, context.description)
  if( projection ) {
    pipeline.push({ $project: projection })
  }

  pipeline.push(...await buildLookupPipeline(references, {
    memoize: context.description.$id,
    project: payload.populate || project,
    properties: context.description.properties,
  }))

  const result = await context.collection.model.aggregate(pipeline).next()
  if( !result ) {
    return null
  }

  return fill(
    unsafe(await traverseDocument(result, context.description, {
      getters: true,
      fromProperties: true,
      recurseReferences: true,
    })),
    context.description
  ) as TDocument
}
