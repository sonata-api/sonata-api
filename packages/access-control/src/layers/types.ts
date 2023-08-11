import type { Context, CollectionStructure, Algorithm } from '@sonata-api/api'
import type { Either } from '@sonata-api/common'
import type { AccessControl } from '../types'
import type { ACErrors } from '../errors'

export type ReadPayload = {
  filters: Record<string, any>
  sort?: Record<string, any>
  limit?: number
}

export type WritePayload = {
  what: Record<string, any>
}

// #region AccessControlLayer
export type AccessControlLayerProps<TPayload extends Record<string, any>=any> = {
  propertyName?: string
  parentId?: string
  childId?: string
  payload: TPayload
}

export type AccessControlLayer<
  TCollections extends Record<string, CollectionStructure>,
  TAlgorithms extends Record<string, Awaited<ReturnType<Algorithm>>>,
  TAccessControl extends AccessControl<TCollections, TAlgorithms, TAccessControl>=any
> = (context: Context<any, TCollections, TAlgorithms, TAccessControl>, props: AccessControlLayerProps) => Promise<Either<
  ACErrors,
  ReadPayload | WritePayload
>>
// #endregion AccessControlLayer
