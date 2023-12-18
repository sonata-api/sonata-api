import type { Context, AccessControlLayerProps, InsertPayload } from '@sonata-api/types'
import { ACErrors } from '@sonata-api/types'
import { left, right } from '@sonata-api/common'

export const checkOwnershipWrite = async (context: Context, props: AccessControlLayerProps<InsertPayload<any>>) => {
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
