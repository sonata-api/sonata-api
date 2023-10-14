import type { Collections } from '@sonata-api/api'
import type { AccessControl, AccessControlLayer, ValidAccessControlLayer } from './types'
import { baseRoles } from './baseRoles'

// #region defineAccessControl
export const defineAccessControl = <TCollections extends Collections>() =>
  <const TAccessControl extends AccessControl<TCollections, TAccessControl>>(accessControl: TAccessControl) => (
    layers?: Partial<Record<ValidAccessControlLayer, AccessControlLayer<TCollections, TAccessControl>>>
) => {
  const roles = {}
  Object.assign(roles, baseRoles)
  Object.assign(roles, accessControl.roles)

  accessControl.roles = roles
  accessControl.layers = layers
  return accessControl
}
// #endregion defineAccessControl
