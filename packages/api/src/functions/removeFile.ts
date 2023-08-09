import type { Context, MongoDocument } from '../types'
import type { UploadAuxProps } from './types'
import { checkImmutability } from '@sonata-api/access-control'
import { createContext } from '../context'

export const removeFile = <_TDocument extends MongoDocument>() => async (payload: UploadAuxProps & { filters: { _id: string } }, context: Context<any, Collections, Algorithms>) => {
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

  return context.collections.file.functions.remove(props, await createContext({
    resourceName: 'file',
    parentContext: context
  }))
}
