import type { CollectionStructure, AlgorithmStructure } from '@sonata-api/api'
import type { AccessControlLayer } from './layers/types'
import type { baseRoles } from './baseRoles'
export { AccessControlLayer }

// #region ValidAccessControlLayer
export type ValidAccessControlLayer =
  'read'
  | 'write'
  | 'call'
// #endregion ValidAccessControlLayer

// #region Role
export type Role<
  TCollections extends Record<string, CollectionStructure>,
  TAlgorithms extends Record<string, AlgorithmStructure>,
  TAccessControl extends AccessControl<TCollections, TAlgorithms>=any
> = {
  inherit?: Array<keyof TAccessControl['roles'] | keyof typeof baseRoles>
  grantEverything?: boolean
  forbidEverything?: boolean
  capabilities?: {
    [P in keyof (TCollections & TAlgorithms)]?: {
      grantEverything?: boolean
      forbidEverything?: boolean
      functions?: 'functions' extends keyof (TCollections & TAlgorithms)[P]
        ? Array<keyof (TCollections & TAlgorithms)[P]['functions']>
        : never
      blacklist?: 'functions' extends keyof (TCollections & TAlgorithms)[P]
        ? Array<keyof (TCollections & TAlgorithms)[P]['functions']>
        : never
    }
  }
}
// #endregion Role

export type Roles<
  TCollections extends Record<string, CollectionStructure>,
  TAlgorithms extends Record<string, AlgorithmStructure>,
  TAccessControl extends AccessControl<TCollections, TAlgorithms>=any
> = Record<string, Role<TCollections, TAlgorithms, TAccessControl>>

// #region AccessControl
export type InternalAccessControl<
  TCollections extends Record<string, CollectionStructure>,
  TAlgorithms extends Record<string, AlgorithmStructure>,
  TAccessControl extends AccessControl<TCollections, TAlgorithms>=any
> = {
  roles?: Roles<TCollections, TAlgorithms, TAccessControl>
  availableRoles?: keyof TAccessControl['roles']
  parent?: TAccessControl['roles']
}

export type AccessControl<
  TCollections extends Record<string, CollectionStructure>,
  TAlgorithms extends Record<string, AlgorithmStructure>,
  TAccessControl extends AccessControl<TCollections, TAlgorithms>=any
> = InternalAccessControl<TCollections, TAlgorithms, TAccessControl> & {
  layers?: Partial<Record<ValidAccessControlLayer, AccessControlLayer<TCollections, TAlgorithms, TAccessControl>>>
}
// #endregion AccessControl

