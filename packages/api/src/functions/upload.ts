import type { Context, OptionalId } from '../types'
import type { UploadAuxProps } from './types'
import { ObjectId } from 'mongodb'
import { checkImmutability } from '@sonata-api/access-control'
import { createContext } from '../context'

export const upload = <_TDocument extends OptionalId<any>>() => async <TContext>(
  payload: UploadAuxProps & { what: { _id?: string } },
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
      childId: props.what._id,
      payload: props
    }
  )

  const file = await context.collections.file.functions!.insert(payload, await createContext({
    resourceName: 'file',
    parentContext: context
  }))

  const insertPayload = context.description.properties[propertyName].type === 'array'
    ? { $addToSet: { [propertyName]: file._id } }
    : { $set: { [propertyName]: file._id } }

  await context.model.updateOne(
    { _id: new ObjectId(parentId) },
    insertPayload
  )

  return file
}
