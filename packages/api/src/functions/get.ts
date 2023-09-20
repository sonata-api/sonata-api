import type { Context, MongoDocument } from '../types'
import type { Filters, Projection } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import { normalizeProjection, fill } from '../collection/utils'
import { LEAN_OPTIONS } from '../constants'

export const get = <TDocument extends MongoDocument>() => async (payload: {
  filters?: Filters<TDocument>,
  project?: Projection<TDocument>
}, context: Context<any, Collections, Algorithms>) => {
  const accessControl = useAccessControl(context)

  const {
    filters = {},
    project = {}
  } = unsafe(await accessControl.beforeRead(payload))

  const result = await context.model.findOne(
    filters,
    normalizeProjection(project, context.description)
  ).lean(LEAN_OPTIONS)

  if( !result ) {
    return result
  }

  return fill(result, context.description)
}
