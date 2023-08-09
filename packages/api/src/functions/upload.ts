import type { Context, MongoDocument } from '../types'
import type { UploadAuxProps } from './types'
import { checkImmutability } from '@sonata-api/access-control'
import { createContext } from '../context'

export const upload = <_TDocument extends MongoDocument>() => async (
  payload: UploadAuxProps & { what: { _id?: string } },
  context: Context<any, Collections, Algorithms>
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
      childId: props.what._id,
      payload: props
    }
  )

  const file = await context.collections.file.functions.insert(props, await createContext({
    resourceName: 'file',
    parentContext: context
  }))

  const insertPayload = context.description.properties[propertyName].type === 'array'
    ? { $addToSet: { [propertyName]: file._id } }
    : { $set: { [propertyName]: file._id } }

  await context.model.updateOne(
    { _id: parentId },
    insertPayload
  )

  return file
}
