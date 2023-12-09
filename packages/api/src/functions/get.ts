import type { CollectionDocument, GetPayload, OptionalId  } from '@sonata-api/types'
import type { Context } from '../types'
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

export const get = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(
  payload: GetPayload<TDocument>,
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

  pipeline.push(...buildLookupPipeline(references, {
    memoize: context.description.$id,
    project,
    properties: context.description.properties
  }))

  const result = await context.model.aggregate(pipeline).next()
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
