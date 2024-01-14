import type { Context } from '@sonata-api/types'
import type { description } from './description'
import { ObjectId } from '@sonata-api/api'
import { left, right } from '@sonata-api/common'
import bcrypt from 'bcrypt'

export enum ActivationErrors {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK',
}

type Props = {
  password: string
}

const activate = async (props: Props, context: Context<typeof description>) => {
  const {
    u: userId,
    t: token,
  } = context.request.query

  if( !userId || !token ) {
    return left(ActivationErrors.InvalidLink)
  }

  const user = await context.collection.model.findOne({
    _id: new ObjectId(userId),
  }, {
    password: 1,
  })

  if( !user ) {
    return left(ActivationErrors.UserNotFound)
  }
  if( user.active ) {
    return left(ActivationErrors.AlreadyActiveUser)
  }

  const equal = await bcrypt.compare(user._id.toString(), token)
  if( !equal ) {
    return left(ActivationErrors.InvalidLink)
  }

  if( !user.password ) {
    if( !props.password ) {
      return context.response.writeHead(302, {
        location: `/user/activation?step=password&u=${userId}&t=${token}`,
      })
    }

    await context.collection.model.updateOne({
      _id: user._id,
    },
    {
      $set: {
        active: true,
        password: await bcrypt.hash(props.password, 10),
      },
    })

    return right(true)
  }

  await context.collection.model.updateOne({
    _id: user._id,
  },
  {
    $set: {
      active: true,
    },
  })

  return context.response.writeHead(302, {
    location: '/user/activation',
  })
}

export default activate
