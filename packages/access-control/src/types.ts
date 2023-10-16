import type { CollectionStructure } from '@sonata-api/api'
import type { AccessControlLayer } from './layers/types'
export { AccessControlLayer }

// #region Role
export type Role<
  TCollectionStructure extends CollectionStructure=any,
  TAccessControl extends AccessControl<TCollectionStructure> = any
> = {
  inherit?: Array<keyof TAccessControl['roles']>
  grantEverything?: boolean
  forbidEverything?: boolean
  functions?: Array<keyof TCollectionStructure['functions']>
  blacklist?: Array<keyof TCollectionStructure['functions']>
}
// #endregion Role

export type Roles<
  TCollectionStructure extends CollectionStructure=any,
  TAccessControl extends AccessControl<TCollectionStructure> = any
> = Record<string, Role<TCollectionStructure, TAccessControl>>

// #region AccessControl
export type InternalAccessControl<
  TCollectionStructure extends CollectionStructure=any,
  TAccessControl extends AccessControl<TCollectionStructure> = any
> = {
  roles?: Roles<TCollectionStructure, TAccessControl>
  availableRoles?: keyof TAccessControl['roles']
  parent?: TAccessControl['roles']
}

export type AccessControl<
  TCollectionStructure extends CollectionStructure=any,
  TAccessControl extends AccessControl<TCollectionStructure, TAccessControl> = any
> = InternalAccessControl<TCollectionStructure, TAccessControl>
// #endregion AccessControl

