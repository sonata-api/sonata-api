import type { Collection, CollectionStructure } from '@sonata-api/types'

let collectionsMemo: Awaited<ReturnType<typeof internalGetCollections>>
const collectionMemo: Record<string, CollectionStructure> = {}

export const getEntrypoint = () => {
  return import(process.argv[1])
}

const internalGetCollections = async (): Promise<Record<string, Collection>> => {
  // @ts-ignore
  const { collections: systemCollections } = await import('@sonata-api/system')
  const { collections: userCollections } = await getEntrypoint()

  return {
    ...systemCollections,
    ...userCollections
  }
}

export const getCollections = async () => {
  if( collectionsMemo ) {
    return collectionsMemo
  }

  collectionsMemo = await internalGetCollections()
  return collectionsMemo
}

export const getCollection = async (collectionName: string) => {
  if( collectionMemo[collectionName] ) {
    return collectionMemo[collectionName]
  }

  const collections = await getCollections()
  const collection = collectionMemo[collectionName] = collections[collectionName]?.()
  return collection
}

