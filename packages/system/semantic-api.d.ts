// this file will be overwritten
import type { AssetType, ResourceErrors, Context as Context_ } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import { Either } from '@sonata-api/common'

declare global {
  type SystemCollections = typeof import('@sonata-api/system/collections')
  type UserCollections = typeof import('./src').collections

  type SystemAlgorithms = typeof import('@sonata-api/system/algorithms')
  type UserAlgorithms = typeof import('./src').algorithms

  type Collections = {
    [K in keyof (SystemCollections & UserCollections)]: Awaited<ReturnType<(SystemCollections & UserCollections)[K]>>
  }

  type Algorithms = {
    [K in keyof (SystemAlgorithms & UserAlgorithms)]: Awaited<ReturnType<(SystemAlgorithms & UserAlgorithms)[K]>>
  }

  type Context<TDescription extends Description=any>
    = Context_<TDescription, Collections, Algorithms>

  type UserAccessControl = typeof accessControl

  type UserACProfile = {
    roles: ReadonlyArray<keyof UserAccessControl['roles']>
  }
}

declare module '@sonata-api/api' {
  export async function getResourceAsset<
    const ResourceName extends keyof Collections,
    const AssetName extends (keyof Collections[ResourceName] & AssetType) | 'model',
    ReturnedAsset=ResourceName extends keyof Collections
        ? AssetName extends keyof Collections[ResourceName]
          ? Collections[ResourceName][AssetName]
          : never
          : never
  >(
    resourceName: ResourceName,
    assetName: AssetName,
  ): Promise<
    Either<
      ResourceErrors,
      ReturnedAsset
    >
  >

  export const get = getResourceAsset

  export async function getFunction<
    ResourceName extends keyof Collections,
    FunctionName extends keyof Collections[ResourceName]['functions'],
    ReturnedFunction=ResourceName extends keyof Collections
        ? FunctionName extends keyof Collections[ResourceName]['functions']
          ? Collections[ResourceName]['functions'][FunctionName]
          : never
          : never
  >(
    resourceName: ResourceName,
    functionName: FunctionName,
    acProfile?: UserACProfile
  ): Promise<
    Either<
      ResourceErrors,
      ReturnedFunction
    >
  >
}
// 