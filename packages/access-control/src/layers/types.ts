import type { Context } from '@sonata-api/api'
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

export type AccessControlLayerProps<TPayload extends Record<string, any>=any> = {
  propertyName?: string
  parentId?: string
  childId?: string
  payload: TPayload
}

export type AccessControlLayer<TAccessControl extends AccessControl<any, TAccessControl> = any> = (context: Context, props: AccessControlLayerProps) => Promise<Either<
  ACErrors,
  ReadPayload | WritePayload
>>
