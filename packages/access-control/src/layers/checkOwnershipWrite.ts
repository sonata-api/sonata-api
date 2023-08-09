import type { AccessControlLayerProps, WritePayload } from './types'
import type { Context } from '@sonata-api/api'
import { left, right } from '@sonata-api/common'
import { ACErrors } from '../errors'

export const checkOwnershipWrite = async (context: Context, props: AccessControlLayerProps<WritePayload>) => {
  const { token, description } = context
  const { parentId } = props

  const payload = Object.assign({}, props.payload)

  if( token.user && description.owned ) {
    if( !payload.what._id || description.owned === 'always' ) {
      payload.what.owner = token.user._id
    } else {
      return right(payload)
    }
  }

  if( (!payload.what.owner && !parentId) && context.description.owned ) {
    return left(ACErrors.OwnershipError)
  }

  return right(payload)
}
