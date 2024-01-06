import type { Property } from '@sonata-api/types'

export type RouteContract =
  | { response: Property | Property[] }
  | { payload: Property }
  | { query: Property }
  | {
  response?: Property | Property[]
  payload?: Property
  query?: Property
}

export const defineContract = <const TRouteContract extends RouteContract>(contract: TRouteContract) => {
  return contract
}
