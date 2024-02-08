import type { Collection } from '@sonata-api/types'

let collectionsMemo: Awaited<ReturnType<typeof internalGetCollections>> | undefined
const collectionMemo: Record<string, Collection> = {}

export const getEntrypoint = async () => {
  const entrypoint = await import(process.argv[1])
  return entrypoint.default
}

const internalGetCollections = async (): Promise<Record<string, Collection | (()=> Collection)>> => {
  const entrypoint = await getEntrypoint()
  return Object.assign({}, entrypoint.options.collections)
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

  collectionsMemo![collectionName] = candidate

  return collection
}

export const getRouter = async () => {
  const entrypoint = await getEntrypoint()
  return entrypoint.router
}
