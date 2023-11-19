import type { CollectionStructure } from '@sonata-api/api'
import type { AccessControlLayer } from './layers/types'
export { AccessControlLayer }

export type Role<
  TCollectionStructure extends CollectionStructure=any,
  TAccessControl extends AccessControl<TCollectionStructure> = any
> = {
  inherit?: (keyof TAccessControl['roles'])[]
  grantEverything?: boolean
  grant?: (keyof TCollectionStructure['functions'])[]
  forbid?: (keyof TCollectionStructure['functions'])[]
}

export type Roles<
  TCollectionStructure extends CollectionStructure=any,
  TAccessControl extends AccessControl<TCollectionStructure> = any
> = Record<string, Role<TCollectionStructure, TAccessControl>>

export type InternalAccessControl<
  TCollectionStructure extends CollectionStructure=any,
  TAccessControl extends AccessControl<TCollectionStructure, TAccessControl> = any
> = {
  roles?: Roles<TCollectionStructure, TAccessControl>
  availableRoles?: keyof TAccessControl['roles']
  parent?: TAccessControl['roles']
}

export type AccessControl<
  TCollectionStructure extends CollectionStructure=any,
  TAccessControl extends AccessControl<TCollectionStructure, TAccessControl> = any
> = InternalAccessControl<TCollectionStructure, TAccessControl>

