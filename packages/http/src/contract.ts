import type { JsonSchema } from '@sonata-api/types'

export type RouteContract = Omit<JsonSchema, '$id'> extends infer PartialSchema
  ? [PartialSchema | null, PartialSchema]
  : never

export const defineContract = <const TRouteContract extends RouteContract>(contract: TRouteContract) => {
  return contract
}
