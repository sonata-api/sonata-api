import type { CollectionProperty, Description } from '@sonata-api/types'
import type { ObjectId } from 'mongodb'
import type { Context } from '../context'
import { isRight, unwrapEither } from '@sonata-api/common'
import { getFunction } from '../assets'
import { getDatabaseCollection } from '../database'

type CascadingRemoveSubject = {
  propertyName: Lowercase<string>
  collectionName: string
}

type CascadingRemove = Array<CascadingRemoveSubject>

const cascadingRemoveMemo: Record<string, CascadingRemove> = {}

const getCascade = (description: Description) => {
  if( cascadingRemoveMemo[description.$id] ) {
    return cascadingRemoveMemo[description.$id] 
  }

  const cascade: CascadingRemove = []
  for( const [propertyName, property] of Object.entries(description.properties) as Array<[Lowercase<string>, CollectionProperty]> ) {
    if( property.s$isFile || property.s$inline ) {
      cascade.push({
        propertyName,
        collectionName: property.s$referencedCollection!
      })
    }
  }

  cascadingRemoveMemo[description.$id] = cascade
  return cascade
}

const preferredRemove = async (subject: CascadingRemoveSubject, targetId: ObjectId | ObjectId[], context: Context) => {
  const coll = getDatabaseCollection(subject.collectionName)

  if( Array.isArray(targetId) ) {
    const removeAllEither = await getFunction(subject.collectionName, 'removeAllAll')
    if( isRight(removeAllEither) ) {
      const removeAll = unwrapEither(removeAllEither)
      return removeAll({
        filters: targetId
      }, context)
    }

    return coll.deleteMany({
      _id: {
        $in: targetId
      }
    })
  }

  const removeEither = await getFunction(subject.collectionName, 'remove')
  if( isRight(removeEither) ) {
    const remove = unwrapEither(removeEither)
    return remove({
      filters: targetId
    }, context)
  }

  return coll.deleteOne({
    _id: targetId
  })
}

export const cascadingRemove = async <TContext>(
  doc: Record<string, any>,
  context: TContext extends Context<infer Description>
    ? TContext
    : never
) => {
  const cascade = getCascade(context.description)
  for( const subject of cascade ) {
    const targetId = doc[subject.propertyName]
    if( targetId && (!Array.isArray(targetId) || targetId.length > 0) ) {
      await preferredRemove(subject, targetId, context as Context)
    }
  }
}
