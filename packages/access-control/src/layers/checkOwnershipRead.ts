import type { AccessControlLayerProps, ReadPayload } from './types'
import type { Context } from '@sonata-api/api'
import { right } from '@sonata-api/common'

export const checkOwnershipRead = async (context: Context, props: AccessControlLayerProps<ReadPayload>) => {
  const { token, description } = context
  const payload = Object.assign({}, props.payload)

  if( token.user && description.owned ) {
    if( !token.user.roles?.includes('root') ) {
      payload.filters.owner = token.user._id
    }
  }

  return right(payload)
}
