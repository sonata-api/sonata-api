import type { Collections } from '@sonata-api/api'
import type { AccessControl } from './types'
import { baseRoles } from './baseRoles'

// #region defineAccessControl
export const defineAccessControl = <TCollections extends Collections>() => <
  const TAccessControl extends AccessControl<TCollections, TAccessControl>
>(accessControl: TAccessControl) => {
  const roles = {}
  Object.assign(roles, baseRoles)
  Object.assign(roles, accessControl.roles)

  accessControl.roles = roles
  return accessControl
}
// #endregion defineAccessControl
