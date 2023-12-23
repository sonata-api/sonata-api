import type { JsonSchema } from '@sonata-api/types'

export type RouteContract = Omit<JsonSchema, '$id'> extends infer PartialSchema
  ? [PartialSchema | null, PartialSchema | PartialSchema[] | null]
  : never

export const defineContract = <const TRouteContract extends RouteContract>(contract: TRouteContract) => {
  return contract
}
