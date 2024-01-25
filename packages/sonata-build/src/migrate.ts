import type { Collection } from '@sonata-api/types'
import { right } from '@sonata-api/common'
import { getDatabase, getDatabaseCollection } from '@sonata-api/api'
import { log } from './log'
import path from 'path'

export const migrate = async () => {
  const collections = require(path.join(process.cwd(), 'dist', 'collections')) as Record<string,
    | Collection
    | (() => Collection)
  >

  const session = await getDatabase()

  for( const collectionName in collections ) {
    const candidate = collections[collectionName as keyof typeof collections]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    if( collection.description.search ) {
      const model = getDatabaseCollection(collectionName)
      const indexes = await model.indexes()
      const searchIndexes = collection.description.search.indexes

      const textIndex = indexes.find((index) => 'textIndexVersion' in index)
      const invalidated = textIndex && !searchIndexes.every((key) => Object.keys(textIndex.weights).includes(key as string))

      if( !textIndex || invalidated ) {
        if( textIndex ) {
          await model.dropIndex(textIndex.name)
        }

        await model.createIndex(searchIndexes.reduce((a, index) => ({
          ...a,
          [index]: 'text'
        }), {}))

        log('info', `new text index created for ${collectionName}`)
      }
    }

    if( collection.description.indexes ) {
      const model = getDatabaseCollection(collectionName)
      const collIndexes = await model.indexes()

      let newIndexes = 0

      for( const index of collection.description.indexes ) {
        const hasIndex = collIndexes.find((collIndex) => (
          !('textIndexVersion' in collIndex)
          && Object.keys(collIndex.key).length === 1
          && index in collIndex.key
        ))

        if( !hasIndex ) {
          await model.createIndex({
            [index]: 1
          })

          newIndexes++
        }
      }

      if( newIndexes ) {
        log('info', `${newIndexes} new indexes created for ${collectionName}`)
      }
    }
  }

  await session.client.close()
  return right('migration succeeded')
}

