import type { Context, MongoDocument } from '../types'
import type { Filters } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'

export const count = <TDocument extends MongoDocument>() => async (
  payload: { filters?: Filters<TDocument> },
  context: Context<any, Collections, Algorithms>
) => {
  const accessControl = useAccessControl(context)
  const newPayload = unsafe(await accessControl.beforeRead(payload))

  return context.model.countDocuments(newPayload.filters)
}
