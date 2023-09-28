import { MongoClient } from 'mongodb'

let __database: ReturnType<MongoClient['db']> | undefined

export const getDatabase = async () => {
  if( !__database ) {
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

    const client = new MongoClient(mongodbUri)
    __database = client.db()
  }

  return __database
}

export const getDatabaseSync = () => {
  if( !__database ) {
    throw new Error('getDatabaseSync() called with no active database')
  }

  return __database
}

export const getCollection = <TDocument extends Record<string, any>>(collectionName: string) => {
  const pluralized = collectionName.endsWith('s')
    ? `${collectionName}es`
    : `${collectionName}s`

  const db = getDatabaseSync()
  return db.collection<TDocument>(pluralized)
}
