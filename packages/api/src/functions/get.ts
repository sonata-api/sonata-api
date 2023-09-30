import type { Context, OptionalId, WithId } from '../types'
import type { Document, Filters, Projection } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import { traverseDocument, normalizeProjection, fill } from '../collection'

export const get = <TDocument extends Document<OptionalId<any>>>() => async <TContext>(payload: {
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

  const result = await context.model.findOne(
    await traverseDocument(filters, context.description, { autoCast: true }), {
      projection: normalizeProjection(project, context.description)
    }
  )

  if( !result ) {
    return null
  }

  return fill(
    await traverseDocument(result, context.description, {
      getters: true,
      fromProperties: true
    }),
    context.description
  ) as WithId<TDocument>
}
