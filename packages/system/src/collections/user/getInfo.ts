import type { Context } from '@sonata-api/api'
import type { description } from './description'
import { left, right } from '@sonata-api/common'
import bcrypt from 'bcrypt'

export enum ActivationErrors {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK'
}

type Props = {
  userId: string
  token: string
}

const getInfo = async (props: Props, context: Context<typeof description>) => {
  const {
    userId,
    token

  } = props

  if( !userId || !token ) {
    return left(ActivationErrors.InvalidLink)
  }

  const user = await context.model.findOne({
    _id: userId
  })

  if( !user ) return left(ActivationErrors.UserNotFound)
  if( user.active ) return left(ActivationErrors.AlreadyActiveUser)

  const equal = await bcrypt.compare(user._id.toString(), token)
  if( !equal ) {
    return left(ActivationErrors.InvalidLink)
  }

  return right({
    full_name: user.full_name,
    email: user.email
  })
}

export default getInfo
