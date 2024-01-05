import type { Property } from '@sonata-api/types'

export type RouteContract = Property | {
  request: Property | null
  response: Property | Property[] | null
}

export const defineContract = <const TRouteContract extends RouteContract>(contract: TRouteContract) => {
  return contract
}
