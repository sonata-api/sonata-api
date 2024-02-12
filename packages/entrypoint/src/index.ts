import type { Collection, ApiConfig } from '@sonata-api/types'

let collectionsMemo: Awaited<ReturnType<typeof internalGetCollections>> | undefined
const collectionMemo: Record<string, Collection | undefined> = {}

export const getEntrypoint = async () => {
  return import(process.cwd())
}

const internalGetCollections = async (): Promise<Record<string, Collection | (()=> Collection) | undefined>> => {
  const entrypoint = await getEntrypoint()
  const collections = entrypoint.collections
    ? entrypoint.collections
    : entrypoint.default.options.collections

  return Object.assign({}, collections)
}

export const getCollections = async () => {
  if( collectionsMemo ) {
    return Object.assign({}, collectionsMemo)
  }

  collectionsMemo = await internalGetCollections()
  return collectionsMemo
}

export const getCollection = async (collectionName: string): Promise<Collection | undefined> => {
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

export const getConfig = async (): Promise<ApiConfig> => {
  const entrypoint = await getEntrypoint()

  return entrypoint.default
    ? entrypoint.default.options.config
    : {}
}

