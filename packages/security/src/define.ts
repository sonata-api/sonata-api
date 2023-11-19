import type { RateLimitingParams } from './rateLimiting'

export type SecurityPolicy = {
  allowQueryOperators?: string[]
  rateLimiting?: Record<string, RateLimitingParams>
  accessControl?: any
}

export const defineSecurityPolicy = <const TSecurityPolicy extends SecurityPolicy>(policy: TSecurityPolicy) => {
  return policy
}
