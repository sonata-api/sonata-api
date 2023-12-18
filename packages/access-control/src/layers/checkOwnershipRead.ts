import type { Context, AccessControlLayerProps, AccessControlLayerReadPayload } from '@sonata-api/types'
import { right } from '@sonata-api/common'

export const checkOwnershipRead = async (context: Context, props: AccessControlLayerProps<AccessControlLayerReadPayload>) => {
  const { token, description } = context
  const payload = Object.assign({}, props.payload)

  if( token.user && description.owned ) {
    if( !token.user.roles?.includes('root') ) {
      payload.filters.owner = token.user._id
    }
  }

  return right(payload)
}
