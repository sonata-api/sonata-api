import type { Context, OptionalId } from '../types'
import type { CollectionDocument, UploadAuxProps } from './types'
import { checkImmutability } from '@sonata-api/access-control'

export const removeFile = <_TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(
  payload: UploadAuxProps & { filters: { _id: string } },
  context: TContext extends Context<infer Description>
    ? TContext
    : never
) => {
  const {
    propertyName,
    parentId,
    ...props

  } = payload

  if( !parentId ) {
    throw new TypeError('no parentId')
  }

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
