import type { AccessControl } from '@sonata-api/access-control'
import type { Description } from '@sonata-api/types'
import type { SecurityPolicy } from '@sonata-api/security'
import type { createModel } from '../collection/schema'

export type ResourceBase = {
  security?: SecurityPolicy
  functions?: Record<string, (...args: any[]) => any>
}

// #region Collection
export type CollectionStructure = ResourceBase & {
  item: any
  description: Description
  model?: () => ReturnType<typeof createModel>
}

export type Collection = () => CollectionStructure|Promise<CollectionStructure>
// #endregion Collection

// #region Algorithm
export type AlgorithmStructure = ResourceBase & {
}

export type Algorithm = () => AlgorithmStructure|Promise<AlgorithmStructure>
// #endregion Algorithm


export type AssetType =
  keyof CollectionStructure
  | keyof AlgorithmStructure

export type ResourceType =
  'collection'
  | 'algorithm'

export type FunctionPath = `${string}@${string}`

export type UnpackFunction<T extends () => any> = Awaited<ReturnType<T>>

export type Collections = Record<string, UnpackFunction<Collection>>
export type Algorithms = Record<string, UnpackFunction<Algorithm>>

export type UserAccessControl = AccessControl<Collections, Algorithms>

export type UserACProfile = {
  readonly roles: string[]
  readonly allowed_functions?: string[]
}
