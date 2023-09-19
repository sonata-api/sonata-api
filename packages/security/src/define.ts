import type { RateLimitingParams } from './rateLimiting'

export type SecurityPolicy = {
  allowQueryOperators?: Array<string>
  rateLimiting?: RateLimitingParams
  accessControl?: any
}

export const defineSecurityPolicy = <const TSecurityPolicy extends SecurityPolicy>(policy: TSecurityPolicy) => {
  return policy
}
