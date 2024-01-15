import type { Context, UploadPayload } from '@sonata-api/types'
import { ObjectId } from 'mongodb'
import { unsafe } from '@sonata-api/common'
import { checkImmutability } from '@sonata-api/security'

export const upload = async <TContext extends Context>(
  payload: UploadPayload,
  context: TContext,
) => {
  const {
    propertyName,
    parentId,
    ...props
  } = payload

  await checkImmutability(context, {
    propertyName,
    parentId,
    childId: props.what._id,
    payload: props,
  })

  const file: any = unsafe(await context.collections.file.functions!.insert(payload))

  const insertPayload = 'items' in context.description.properties[propertyName]
    ? {
      $addToSet: {
        [propertyName]: file._id,
      },
    }
    : {
      $set: {
        [propertyName]: file._id,
      },
    }

  await context.collection.model.updateOne({
    _id: new ObjectId(parentId),
  },
  insertPayload)

  return file
}
