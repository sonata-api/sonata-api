import type { Context, OptionalId } from '../types'
import type { CollectionDocument, Filters } from './types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import { traverseDocument } from '../collection'

export const count = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(
  payload: { filters?: Filters<TDocument> },
  context: TContext extends Context<infer Description>
    ? TContext
    : never
) => {
  const accessControl = useAccessControl(context)
  const newPayload = unsafe(await accessControl.beforeRead(payload))

  return context.model.countDocuments(unsafe(await traverseDocument(newPayload.filters, context.description, {
    autoCast: true,
    allowOperators: true
  })))
}
