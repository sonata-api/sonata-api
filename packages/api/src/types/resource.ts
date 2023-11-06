import type { AccessControl } from '@sonata-api/access-control'
import type { Description } from '@sonata-api/types'
import type { SecurityPolicy } from '@sonata-api/security'

export type CollectionStructure<TCollectionStructure extends CollectionStructure = any> = {
  item: any
  description: Description
  security?: SecurityPolicy
  accessControl?: AccessControl<TCollectionStructure>
  functions?: Record<string, (...args: any[]) => any>
  $functions?: Record<string, (...args: any[]) => any>
}

export type Collection<TCollectionStructure extends CollectionStructure = any> =
  CollectionStructure<TCollectionStructure> extends infer RecursiveCollection
    ? () => RecursiveCollection
    : never

export type AssetType = keyof CollectionStructure

export type FunctionPath = `${string}@${string}`
export type Collections = Record<string, ReturnType<Collection>>

export type UserACProfile = {
  readonly roles: string[]
  readonly allowed_functions?: string[]
}
