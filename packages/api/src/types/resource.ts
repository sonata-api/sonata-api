import type { AccessControl } from '@sonata-api/access-control'
import type { Description } from '@sonata-api/types'
import type { SecurityPolicy } from '@sonata-api/security'

// #region Collection
export type CollectionStructure = {
  item: any
  description: Description
  security?: SecurityPolicy
  accessControl?: AccessControl<Collections>
  functions?: Record<string, (...args: any[]) => any>
}

export type Collection = () => CollectionStructure|Promise<CollectionStructure>
// #endregion Collection

export type AssetType = keyof CollectionStructure

export type FunctionPath = `${string}@${string}`

export type UnpackFunction<T extends () => any> = Awaited<ReturnType<T>>
export type Collections = Record<string, UnpackFunction<Collection>>

export type UserACProfile = {
  readonly roles: string[]
  readonly allowed_functions?: string[]
}
