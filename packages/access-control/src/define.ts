import type { Collections } from '@sonata-api/api'
import type { AccessControl } from './types'

// #region defineAccessControl
export const defineAccessControl = <TCollections extends Collections>() => <
  const TAccessControl extends AccessControl<TCollections, TAccessControl>
>(accessControl: TAccessControl) => {
  return accessControl
}
// #endregion defineAccessControl
