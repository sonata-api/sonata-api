import { MongoClient } from 'mongodb'

let dbMemo: ReturnType<MongoClient['db']> | undefined

export const getDatabase = async () => {
  if( !dbMemo ) {
    const mongodbUri = await (async () => {
      const envUri = process.env.MONGODB_URI
      if( !envUri ) {
        console.warn(
          `mongo URI wasn't supplied, fallbacking to memory storage (this means your data will only be alive during runtime)`
        )

        const { MongoMemoryServer } = require('mongodb-memory-server')
        const mongod = await MongoMemoryServer.create()
        return mongod.getUri()
      }

      return envUri
    })()

    const client = new MongoClient(mongodbUri, {
      monitorCommands: process.env.NODE_ENV === 'development'
    })

    if( process.env.NODE_ENV === 'development' ) {
      client.on('commandStarted', (event) => console.debug(JSON.stringify(event, null, 2)))
    }

    dbMemo = client.db()
  }

  return dbMemo
}

export const getDatabaseSync = () => {
  if( !dbMemo ) {
    throw new Error('getDatabaseSync() called with no active database')
  }

  return dbMemo
}

export const prepareCollectionName = (collectionName: string) => {
  const pluralized = collectionName.endsWith('s')
    ? `${collectionName}es`
    : `${collectionName}s`

  return pluralized.toLowerCase()
}

export const getDatabaseCollection = <TDocument extends Record<string, any>>(collectionName: string) => {
  const db = getDatabaseSync()
  return db.collection<TDocument>(prepareCollectionName(collectionName))
}
