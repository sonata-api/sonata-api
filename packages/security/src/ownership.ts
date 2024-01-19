import type { Context, InsertPayload } from '@sonata-api/types'
import type { SecurityCheckProps, SecurityCheckReadPayload } from './types'
import { ACErrors } from '@sonata-api/types'
import { left, right } from '@sonata-api/common'

export const checkOwnershipRead = async (props: SecurityCheckProps<SecurityCheckReadPayload>, context: Context) => {
  const { token, description } = context
  const payload = Object.assign({}, props.payload)

  if( token.authenticated && description.owned ) {
    if( !token.user.roles.includes('root') ) {
      payload.filters.owner = token.user._id
    }
  }

  return right(payload)
}

export const checkOwnershipWrite = async (props: SecurityCheckProps<InsertPayload<any>>, context: Context) => {
  const { token, description } = context
  const { parentId } = props

  const payload = Object.assign({}, props.payload)

  if( token.authenticated && description.owned ) {
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

