import type { AccessControl } from '@sonata-api/access-control'
import type { Description } from '@sonata-api/types'
import type { SecurityPolicy } from '@sonata-api/security'

// #region Collection
export type CollectionStructure<TCollectionStructure extends CollectionStructure = any> = {
  item: any
  description: Description
  security?: SecurityPolicy
  accessControl?: AccessControl<TCollectionStructure>
  functions?: Record<string, (...args: any[]) => any>
}

export type Collection<TCollectionStructure extends CollectionStructure = any> =
  CollectionStructure<TCollectionStructure> extends infer RecursiveCollection
    ? () => RecursiveCollection
    : never
// #endregion Collection

export type AssetType = keyof CollectionStructure

export type FunctionPath = `${string}@${string}`

export type UnpackFunction<T extends () => any> = Awaited<ReturnType<T>>
export type Collections = Record<string, UnpackFunction<Collection>>

export type UserACProfile = {
  readonly roles: string[]
  readonly allowed_functions?: string[]
}
