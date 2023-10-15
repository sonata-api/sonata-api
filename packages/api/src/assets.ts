import type { AssetType, Context, Collection, CollectionStructure } from './types'
import { left, right, isLeft, unwrapEither, type Right } from '@sonata-api/common'
import { limitRate } from '@sonata-api/security'
import { isGranted, ACErrors } from '@sonata-api/access-control'

let collectionsMemo: Awaited<ReturnType<typeof internalGetCollections>>
const collectionMemo: Record<string, CollectionStructure> = {}

const assetsMemo: {
  assets: Record<string, Record<string, Awaited<ReturnType<typeof internalGetCollectionAsset>>>> 
} = {
  assets: {}
}

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
  const collection = collectionMemo[collectionName] = await collections[collectionName]?.()
  return collection
}

export const internalGetCollectionAsset = async <
  TCollectionName extends string,
  TAssetName extends  keyof Collections[TCollectionName] & AssetType
>(
  collectionName: TCollectionName,
  assetName: TAssetName,
) => {
  const collection = await getCollection(collectionName)
  const asset = collection?.[assetName as AssetType]

  if( !asset ) {
    if( !collection ) return left(ACErrors.ResourceNotFound)
    return left(ACErrors.AssetNotFound)
  }

  return right(asset)
}

export const getCollectionAsset = async <
  TCollectionName extends string,
  TAssetName extends keyof Collections[TCollectionName] & AssetType
>(
  collectionName: TCollectionName,
  assetName: TAssetName,
) => {
  const cached = assetsMemo.assets[collectionName]
  if( cached?.[assetName] ) {
    return right(cached[assetName] as NonNullable<CollectionStructure[TAssetName]>)
  }

  const assetEither = await internalGetCollectionAsset(collectionName, assetName as any)
  if( isLeft(assetEither) ) {
    return assetEither
  }

  const asset = unwrapEither(assetEither) as NonNullable<CollectionStructure[TAssetName]>
  assetsMemo.assets[collectionName as string] ??= {}
  assetsMemo.assets[collectionName as string][assetName] = asset

  return right(asset)
}

export const get = internalGetCollectionAsset

export const getFunction = async <
  TCollectionName extends string,
  TFunctionName extends string
>(
  collectionName: TCollectionName,
  functionName: TFunctionName,
  acProfile?: UserACProfile,
) => {
  if( acProfile ) {
    if( !await isGranted(String(collectionName), String(functionName), acProfile) ) {
      return left(ACErrors.AuthorizationError)
    }
  }

  const functionsEither = await getCollectionAsset(collectionName, 'functions')
  if( isLeft(functionsEither) ) {
    return functionsEither
  }

  const functions = unwrapEither(functionsEither) 
  if( !(functionName in functions) ) {
    return left(ACErrors.FunctionNotFound)
  }

  const fn = async (payload: any, context: Context<any, Collections>) => {
    const collection = await (await getCollections())[collectionName]()
    if( collection.security?.rateLimiting?.[functionName] ) {
      const rateLimitingEither = await limitRate(context, collection.security.rateLimiting[functionName])
      if( isLeft(rateLimitingEither) ) {
        return left({
          error: unwrapEither(rateLimitingEither),
          httpCode: 429
        })
      }
    }

    return functions[functionName](payload, context)
  }

  return right(fn)
}
