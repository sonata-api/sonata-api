import { compare as bcryptCompare } from 'bcrypt'
import { signToken, type Context, type WithId } from '@sonata-api/api'
import { left, right } from '@sonata-api/common'
import { description, type User } from './description'

type Props = {
  email: string
  password: string
} | {
  revalidate: true
}

type Return = {
  user: Pick<User,
    'first_name'
    | 'last_name'
    | 'email'
    | 'roles'
    | 'active'
  >
  token: {
    type: 'bearer'
    token: string
  }
}

export enum AuthenticationErrors {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  InactiveUser = 'INACTIVE_USER',
}

const getUser = async (user: Pick<WithId<User>, '_id'>, context: Context<typeof description>) => {
  const leanUser = await context.collection.functions.get({
    filters: {
      _id: user._id 
    }
  }, context)

  if( !leanUser ) {
    return
  }

  const tokenContent = {
    user: {
      _id: leanUser._id,
      roles: leanUser.roles
    },
  }

  if( context.apiConfig.logSuccessfulAuthentications ) {
    await context.log('successful authentication', {
      email: leanUser.email,
      roles: leanUser.roles,
      _id: leanUser._id
    })
  }

  if( context.apiConfig.tokenUserProperties ) {
    const pick = (obj: any, properties: Array<string>) => properties.reduce((a, prop) => {
      if( 'prop' in obj ) {
        return a
      }

      return {
        ...a,
        [prop]: obj[prop]
      }
    }, {})

    Object.assign(tokenContent.user, pick(leanUser, context.apiConfig.tokenUserProperties))
  }

  const token = await signToken(tokenContent)

  return {
    user: leanUser,
    token: {
      type: 'bearer',
      token
    }
  } as Return
}

const authenticate = async (props: Props, context: Context<typeof description>) => {
  if( 'revalidate' in props ) {
    return right(await getUser(context.token.user, context))
  }

  if( typeof props?.email !== 'string' ) {
    return left(AuthenticationErrors.InvalidCredentials)
  }

  if(
    props.email === process.env.GODMODE_USERNAME
  && props.password === process.env.GODMODE_PASSWORD
  ) {
    const token = await signToken({
      user: {
        _id: null,
        roles: ['root']
      },
    })

    return right({
      user: {
        first_name: 'God',
        last_name: 'Mode',
        email: '',
        roles: ['root'],
        active: true,
      },
      token: {
        type: 'bearer',
        token
      }
    })
  }

  const user = await context.model.findOne(
    { email: props.email },
    {
      email: 1,
      password: 1,
      active: 1
    }
  )

  if( !user || !await bcryptCompare(props.password, user.password!) ) {
    return left(AuthenticationErrors.InvalidCredentials)
  }

  if( !user.active ) {
    return left(AuthenticationErrors.InactiveUser)
  }

  return right(await getUser(user, context))
}

export default authenticate
