import type { ResourceType, AssetType, Context } from './types'
import { unsafe, left, right, isLeft, unwrapEither, type Right } from '@sonata-api/common'
import { isGranted, ACErrors, type AccessControl } from '@sonata-api/access-control'
import { preloadDescription } from './collection/preload'

const __cachedResources: Awaited<ReturnType<typeof internalGetResources>> & {
  _cached: boolean
} = {
  _cached: false,
  collections: {},
  algorithms: {}
}

const __cachedAssets: {
  assets: Record<string, Record<string, Awaited<ReturnType<typeof internalGetResourceAsset>>>> 
} = {
  assets: {}
}

export const requireWrapper = (path: string) => {
  const content = require(path)
  return content.default || content
}

const internalGetResources = async () => {
  if( process.env.SONATA_API_SHALLOW_IMPORT ) {
    return {
      collections: {},
      algorithms: {}
    }
  }
  
  // @ts-ignore
  const { collections, algorithms } = await import('@sonata-api/system')
  const userConfig = await import(process.cwd() + '/index.js')
  const resources = {
    collections,
    algorithms
  }

  Object.assign(resources.collections, userConfig.collections)
  Object.assign(resources.algorithms, userConfig.algorithms)

  return resources
}

export const getAccessControl = async () => {
  if( process.env.SONATA_API_SHALLOW_IMPORT ) {
    return {} as AccessControl<Collections, Algorithms>
  }

  const userConfig = await import(process.cwd() + '/index.js')
  return userConfig.accessControl as AccessControl<Collections, Algorithms>
}

export const getResources = async () => {
  if( __cachedResources._cached ) {
    return __cachedResources
  }

  const resources = await internalGetResources()
  Object.assign(__cachedResources, {
    ...resources,
    _cached: true
  })

  return resources
}

export const internalGetResourceAsset = async <
  ResourceName extends keyof Collections,
  AssetName extends (keyof Collections[ResourceName] & AssetType) | 'model',
  TResourceType extends `${ResourceType}s`
>(
  resourceName: ResourceName,
  assetName: AssetName,
  _resourceType?: TResourceType
) => {
  if( process.env.SONATA_API_SHALLOW_IMPORT ) {
    return {} as Right<{}>
  }

  const resources = await getResources()
  const resourceType = _resourceType || 'collections'

  const asset = (await resources[resourceType][resourceName]?.())?.[assetName] as Collections[ResourceName][AssetName]

  const result = right(await (async () => {
    switch( assetName ) {
      case 'model': {
        if( !asset ) {
          const description = unsafe(await getResourceAsset(resourceName, 'description'), `${String(resourceName)} description`) as any
          const { createModel } = await import('./collection/schema')
          return createModel(description)
        }

        return typeof asset === 'function'
          ? asset()
          : asset
      }

      default:
        return asset
    }
  })())

  if( !result.value ) {
    if( !(resourceName in resources[resourceType]) ) return left(ACErrors.ResourceNotFound)
    if( !(assetName in resources[resourceType][resourceName]()) ) return left(ACErrors.AssetNotFound)
  }

  return result as Exclude<typeof result, Right<never>>
}

export const getResourceAsset = async <
  ResourceName extends keyof Collections,
  AssetName extends (keyof Collections[ResourceName] & AssetType) | 'model',
  TResourceType extends `${ResourceType}s`
>(
  resourceName: ResourceName,
  assetName: AssetName,
  _resourceType?: TResourceType
) => {
  const cached = __cachedAssets.assets[resourceName as string]
  if( cached?.[assetName] ) {
    return cached[assetName] as Exclude<Collections[ResourceName][AssetName], unknown>
  }

  const asset = await internalGetResourceAsset(resourceName, assetName, _resourceType)

  __cachedAssets.assets[resourceName as string] ??= {}
  __cachedAssets.assets[resourceName as string][assetName] = asset

  return asset
}

export const get = internalGetResourceAsset

export const getFunction = async <
  ResourceName extends keyof Collections,
  FunctionName extends keyof Collections[ResourceName]['functions'],
  TResourceType extends `${ResourceType}s` & keyof UserConfig,
  ReturnedFunction=ResourceName extends keyof UserConfig[TResourceType]
      ? FunctionName extends keyof Collections[ResourceName][TResourceType]
        ? Collections[ResourceName]['functions'][FunctionName]
        : never
        : never
>(
  resourceName: ResourceName,
  functionName: FunctionName,
  acProfile?: UserACProfile,
  resourceType?: TResourceType
) => {
  if( acProfile ) {
    if( !await isGranted(String(resourceName), String(functionName), acProfile as any) ) {
      return left(ACErrors.AuthorizationError)
    }
  }

  const functionsEither = await getResourceAsset(resourceName, 'functions', resourceType || 'collections')
  if( isLeft(functionsEither) ) {
    return functionsEither
  }

  const functions = unwrapEither(functionsEither) 
  if( !(functionName in functions) ) {
    return left(ACErrors.FunctionNotFound)
  }

  const accessControl = await getAccessControl()
  if( accessControl.layers?.call ) {
    const fn = async (payload: any, context: Context<any, Collections, Algorithms>) => {
      await accessControl.layers!.call!(context, { payload })
      return functions[functionName](payload, context)
    }

    return right(fn as ReturnedFunction)
  }

  return right(functions[functionName] as ReturnedFunction)
}
