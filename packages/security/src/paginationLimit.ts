import type { Context } from '@sonata-api/types'
import type { SecurityCheckProps, SecurityCheckReadPayload } from './types'
import { ACErrors } from '@sonata-api/types'
import { left, right } from '@sonata-api/common'

export const paginationLimit = async (_context: Context, props: SecurityCheckProps<SecurityCheckReadPayload>) => {
  const { payload } = props
  if( payload.limit ) {
    if( payload.limit <= 0 || payload.limit > 150 ) {
      return left(ACErrors.InvalidLimit)
    }
  }

  return right(payload)
}

