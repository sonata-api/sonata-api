// this file will be overwritten
import type { AssetType, ResourceErrors, Schema, Context as Context_ } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import type { Either } from '@sonata-api/common'

declare global {
  type SystemCollections = typeof import('@sonata-api/system/collections')
  type UserCollections = typeof import('./src').collections

  type Collections = {
    [K in keyof (SystemCollections & UserCollections)]: Awaited<ReturnType<(SystemCollections & UserCollections)[K]>>
  }

  type Context<TDescription extends Description=any>
    = Context_<TDescription, Collections>
}

declare module '@sonata-api/api' {
  export async function getCollectionAsset<
    const CollectionName extends keyof Collections,
    const AssetName extends keyof Collections[CollectionName] & AssetType,
    ReturnedAsset=AssetName extends keyof Collections[CollectionName]
      ? Collections[CollectionName][AssetName]
      : never
  >(
    collectionName: CollectionName,
    assetName: AssetName,
  ): Promise<
    Either<
      ResourceErrors,
      ReturnedAsset
    >
  >

  export const get = getCollectionAsset

  export async function getFunction<
    CollectionName extends keyof Collections,
    FunctionName extends keyof Collections[CollectionName]['functions'],
    ReturnedFunction=FunctionName extends keyof Collections[CollectionName]['functions']
      ? Collections[CollectionName]['functions'][FunctionName]
      : never
  >(
    collectionName: CollectionName,
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