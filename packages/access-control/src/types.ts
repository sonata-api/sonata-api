import type { Collections } from '@sonata-api/api'
import type { AccessControlLayer } from './layers/types'
import type { baseRoles } from './baseRoles'
export { AccessControlLayer }

// #region Role
export type Role<
  TCollections extends Collections=any,
  TAccessControl extends AccessControl<TCollections>=any
> = {
  inherit?: Array<keyof TAccessControl['roles'] | keyof typeof baseRoles>
  grantEverything?: boolean
  forbidEverything?: boolean
  capabilities?: {
    [P in keyof TCollections]?: {
      grantEverything?: boolean
      forbidEverything?: boolean
      functions?: 'functions' extends keyof TCollections[P]
        ? Array<keyof TCollections[P]['functions']>
        : never
      blacklist?: 'functions' extends keyof TCollections[P]
        ? Array<keyof TCollections[P]['functions']>
        : never
    }
  }
}
// #endregion Role

export type Roles<
  TCollections extends Collections=any,
  TAccessControl extends AccessControl<TCollections>=any
> = Record<string, Role<TCollections, TAccessControl>>

// #region AccessControl
export type InternalAccessControl<
  TCollections extends Collections,
  TAccessControl extends AccessControl<TCollections>=any
> = {
  roles?: Roles<TCollections, TAccessControl>
  availableRoles?: keyof TAccessControl['roles']
  parent?: TAccessControl['roles']
}

export type AccessControl<
  TCollections extends Collections=any,
  TAccessControl extends AccessControl<TCollections, TAccessControl>=any
> = InternalAccessControl<TCollections, TAccessControl>
// #endregion AccessControl

