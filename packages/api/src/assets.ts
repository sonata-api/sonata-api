import type { AssetType, Context, Collection, ACProfile  } from '@sonata-api/types'
import { ACErrors } from '@sonata-api/types'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'
import { limitRate } from '@sonata-api/security'
import { isGranted } from '@sonata-api/access-control'
import { getCollection } from '@sonata-api/entrypoint'

const assetsMemo: {
  assets: Record<string, Record<string, Awaited<ReturnType<typeof internalGetCollectionAsset>>>> 
} = {
  assets: {}
}

export const internalGetCollectionAsset = async <
  TCollectionName extends string,
  TAssetName extends keyof Collections[TCollectionName] & AssetType
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
    return right(cached[assetName] as NonNullable<Collection[TAssetName]>)
  }

  const assetEither = await internalGetCollectionAsset(collectionName, assetName as any)
  if( isLeft(assetEither) ) {
    return assetEither
  }

  const asset = unwrapEither(assetEither) as NonNullable<Collection[TAssetName]>
  assetsMemo.assets[collectionName as string] ??= {}
  assetsMemo.assets[collectionName as string][assetName] = asset

  return right(asset)
}

export const getFunction = async <
  TCollectionName extends string,
  TFunctionName extends string
>(
  collectionName: TCollectionName,
  functionName: TFunctionName,
  acProfile?: ACProfile,
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

  const fn = async (payload: any, context: Context) => {
    const collection = await getCollection(collectionName)
    if( !collection ) {
      return left(ACErrors.ResourceNotFound)
    }

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
