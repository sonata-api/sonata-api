import type { CollectionDocument, RemoveFilePayload, OptionalId } from '@sonata-api/types'
import type { Context } from '../types'
import { checkImmutability } from '@sonata-api/access-control'

export const removeFile = <_TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(
  payload: RemoveFilePayload,
  context: TContext extends Context<infer Description>
    ? TContext
    : never
) => {
  const {
    propertyName,
    parentId,
    ...props

  } = payload

  await checkImmutability(
    context, {
      propertyName,
      parentId,
      childId: props.filters._id,
      payload: props
    }
  )

  return context.collections.file.functions!.remove(props)
}
