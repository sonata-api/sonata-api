import type { Context, OptionalId } from '../types'
import type { Filters, Projection } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import { normalizeProjection, fill } from '../collection/utils'

export const get = <TDocument extends OptionalId<any>>() => async <TContext>(payload: {
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
    filters,
    normalizeProjection(project, context.description)
  )

  if( !result ) {
    return result
  }

  return fill(result, context.description)
}
