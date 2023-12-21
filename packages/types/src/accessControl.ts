import type { Context, Collection, Either, GetAllPayload, InsertPayload } from '.'

export enum ACErrors {
  AuthorizationError = 'AUTHORIZATION_ERROR',
  AuthenticationError = 'AUTHENTICATION_ERROR',
  ImmutabilityIncorrectChild = 'IMMUTABILITY_INCORRECT_CHILD',
  ImmutabilityParentNotFound = 'IMMUTABILITY_PARENT_NOT_FOUND',
  ImmutabilityTargetImmutable = 'IMMUTABILITY_TARGET_IMMUTABLE',
  OwnershipError = 'OWNERSHIP_ERROR',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
  AssetNotFound = 'ASSET_NOT_FOUND',
  FunctionNotFound = 'FUNCTION_NOT_FOUND'
}

export type AccessControlLayerReadPayload = {
  filters: Record<string, any>
  sort?: Record<string, any>
  limit?: number
  offset?: number
}

export type AccessControlLayerWritePayload = {
  what: Record<string, any>
}

export type AccessControlLayerProps<TPayload extends Record<string, any> = any> = {
  propertyName?: string
  parentId?: string
  childId?: string
  payload: TPayload
}

export type AccessControlLayer<TAccessControl extends AccessControl<any, TAccessControl> = any> = (context: Context, props: AccessControlLayerProps) => Promise<Either<
  ACErrors,
  GetAllPayload<any> | InsertPayload<any>
>>

export type Role<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection> = any
> = {
  inherit?: (keyof TAccessControl['roles'])[]
  grantEverything?: boolean
  grant?: (keyof TCollection['functions'])[]
  forbid?: (keyof TCollection['functions'])[]
}

export type Roles<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection> = any
> = Record<string, Role<TCollection, TAccessControl>>

export type InternalAccessControl<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection, TAccessControl> = any
> = {
  roles?: Roles<TCollection, TAccessControl>
  availableRoles?: keyof TAccessControl['roles']
  parent?: TAccessControl['roles']
}

export type AccessControl<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection, TAccessControl> = any
> = InternalAccessControl<TCollection, TAccessControl>


export type ACProfile = {
  readonly roles?: string[]
  readonly allowed_functions?: string[]
}
