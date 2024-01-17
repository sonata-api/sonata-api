import type { Property } from '@sonata-api/types'

export type Contract =
  | { response: Property | Property[] }
  | { payload: Property }
  | { query: Property }
  | {
    response?: Property | Property[]
    payload?: Property
    query?: Property
  }

export const defineContract = <const TContract extends Contract>(contract: TContract) => {
  return contract
}
