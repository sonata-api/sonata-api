import type { Property } from '@sonata-api/types'

export type RouteContract = Property | {
  payload?: Property
  response?: Property | Property[]
  query?: Property | Property[]
}

export const defineContract = <const TRouteContract extends RouteContract>(contract: TRouteContract) => {
  return contract
}
