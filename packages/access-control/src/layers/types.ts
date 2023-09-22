import type { Context, Collections, Algorithms } from '@sonata-api/api'
import type { Either } from '@sonata-api/common'
import type { AccessControl } from '../types'
import type { ACErrors } from '../errors'

export type ReadPayload = {
  filters: Record<string, any>
  sort?: Record<string, any>
  limit?: number
  offset?: number
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
  TCollections extends Collections,
  TAlgorithms extends Algorithms,
  TAccessControl extends AccessControl<TCollections, TAlgorithms, TAccessControl>=any
> = (context: Context<any, TCollections, TAlgorithms, TAccessControl>, props: AccessControlLayerProps) => Promise<Either<
  ACErrors,
  ReadPayload | WritePayload
>>
// #endregion AccessControlLayer
