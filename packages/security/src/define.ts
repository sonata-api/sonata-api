import type { SecurityPolicy } from '@sonata-api/types'

export const defineSecurityPolicy = <const TSecurityPolicy extends SecurityPolicy>(policy: TSecurityPolicy) => {
  return policy
}
