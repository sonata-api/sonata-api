import type { AssetType, Context, Collection, CollectionStructure } from './types'
import { left, right, isLeft, unwrapEither, type Right } from '@sonata-api/common'
import { limitRate } from '@sonata-api/security'
import { isGranted, ACErrors, type AccessControl } from '@sonata-api/access-control'

const resourcesMemo = {
  _cached: false,
  collections: {} as Awaited<ReturnType<typeof internalGetResources>>
}

const assetsMemo: {
  assets: Record<string, Record<string, Awaited<ReturnType<typeof internalGetResourceAsset>>>> 
} = {
  assets: {}
}

export const getEntrypoint = () => {
  return import(process.argv[1])
}

const internalGetResources = async (): Promise<Record<string, Collection>> => {
  if( process.env.SONATA_API_SHALLOW_IMPORT ) {
    return {}
  }
  
  // @ts-ignore
  const { collections: systemCollections } = await import('@sonata-api/system')
  const { collections: userCollections } = await getEntrypoint()

  return {
    ...systemCollections,
    ...userCollections
  }
}

export const getAccessControl = async () => {
  if( process.env.SONATA_API_SHALLOW_IMPORT ) {
    return {} as AccessControl<Collections>
  }

  const userConfig = await getEntrypoint()
  return userConfig.accessControl as AccessControl<Collections>
}

export const getResources = async () => {
  if( resourcesMemo._cached ) {
    return resourcesMemo.collections
  }

  Object.assign(resourcesMemo, {
    _cached: true,
    collections: await internalGetResources()
  })

  return resourcesMemo.collections
}

export const internalGetResourceAsset = async <
  ResourceName extends string,
  AssetName extends  keyof Collections[ResourceName] & AssetType
>(
  resourceName: ResourceName,
  assetName: AssetName,
) => {
  if( process.env.SONATA_API_SHALLOW_IMPORT ) {
    return {} as Right<CollectionStructure[AssetName]>
  }

  const resources = await getResources()
  const asset = (await resources[resourceName]?.())?.[assetName as AssetType] as CollectionStructure[AssetName]

  if( !asset ) {
    if( !(resourceName in resources) ) return left(ACErrors.ResourceNotFound)
    return left(ACErrors.AssetNotFound)
  }

  return right(asset)
}

export const getResourceAsset = async <
  TResourceName extends string,
  TAssetName extends keyof Collections[TResourceName] & AssetType
>(
  resourceName: TResourceName,
  assetName: TAssetName,
) => {
  const cached = assetsMemo.assets[resourceName]
  if( cached?.[assetName] ) {
    return right(cached[assetName] as NonNullable<CollectionStructure[TAssetName]>)
  }

  const assetEither = await internalGetResourceAsset(resourceName, assetName as any)
  if( isLeft(assetEither) ) {
    return assetEither
  }

  const asset = unwrapEither(assetEither) as NonNullable<CollectionStructure[TAssetName]>
  assetsMemo.assets[resourceName as string] ??= {}
  assetsMemo.assets[resourceName as string][assetName] = asset

  return right(asset)
}

export const get = internalGetResourceAsset

export const getFunction = async <
  TResourceName extends string,
  TFunctionName extends string
>(
  resourceName: TResourceName,
  functionName: TFunctionName,
  acProfile?: UserACProfile,
) => {
  if( acProfile ) {
    if( !await isGranted(String(resourceName), String(functionName), acProfile) ) {
      return left(ACErrors.AuthorizationError)
    }
  }

  const functionsEither = await getResourceAsset(resourceName as string, 'functions')
  if( isLeft(functionsEither) ) {
    return functionsEither
  }

  const functions = unwrapEither(functionsEither) 
  if( !(functionName in functions) ) {
    return left(ACErrors.FunctionNotFound)
  }

  const fn = async (payload: any, context: Context<any, Collections>) => {
    const resource = await (await getResources())[resourceName]()
    if( resource.security?.rateLimiting?.[functionName] ) {
      const rateLimitingEither = await limitRate(context, resource.security.rateLimiting[functionName])
      if( isLeft(rateLimitingEither) ) {
        return left({
          error: unwrapEither(rateLimitingEither),
          httpCode: 429
        })
      }
    }

    const accessControl = await getAccessControl()
    if( accessControl.layers?.call ) {
      await accessControl.layers.call!(context, { payload })
    }

    return functions[functionName](payload, context)
  }

  return right(fn)
}
