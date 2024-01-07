import type { Collection } from '@sonata-api/types'

let collectionsMemo: Awaited<ReturnType<typeof internalGetCollections>>
const collectionMemo: Record<string, Collection> = {}

export const getEntrypoint = () => {
  return import(process.argv[1])
}

const internalGetCollections = async (): Promise<Record<string, Collection | (() => Collection)>> => {
  const { collections } = await getEntrypoint()
  return Object.assign({}, collections)
}

export const getCollections = async () => {
  if( collectionsMemo ) {
    return Object.assign({}, collectionsMemo)
  }

  collectionsMemo = await internalGetCollections()
  return collectionsMemo
}

export const getCollection = async (collectionName: string) => {
  if( collectionMemo[collectionName] ) {
    return collectionMemo[collectionName]
  }

  const collections = await getCollections()

  const candidate = collections[collectionName]
  if( !candidate ) {
    return
  }

  const collection = typeof candidate === 'function'
    ? candidate()
    : candidate

  collectionsMemo[collectionName] = candidate

  return collection
}

export const getRouter = async () => {
  const entrypoint = await getEntrypoint()
  return entrypoint.router
}
