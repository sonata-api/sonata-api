import type { Context, Collections, } from '@sonata-api/api'
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
  TCollections extends Collections = any,
  TAccessControl extends AccessControl<TCollections, TAccessControl> = any
> = (context: Context<any, TCollections>, props: AccessControlLayerProps) => Promise<Either<
  ACErrors,
  ReadPayload | WritePayload
>>
// #endregion AccessControlLayer
