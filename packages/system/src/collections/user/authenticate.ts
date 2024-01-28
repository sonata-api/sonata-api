import type { Context, SchemaWithId } from '@sonata-api/types'
import type { description } from './description'
import { compare as bcryptCompare } from 'bcrypt'
import { signToken } from '@sonata-api/api'
import { left, right } from '@sonata-api/common'

type Props = {
  email: string
  password: string
} | {
  revalidate: true
}

type Return = {
  user: Pick<SchemaWithId<typeof description>,
    | '_id'
    | 'full_name'
    | 'email'
    | 'roles'
    | 'active'
  >
  token: {
    type: 'bearer'
    content: string
  }
}

export enum AuthenticationErrors {
  Unauthenticated = 'UNAUTHENTICATED',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  InactiveUser = 'INACTIVE_USER',
}

const getUser = async (user: Pick<SchemaWithId<typeof description>, '_id'>,
  context: Context<typeof description, Collections['user']['functions']>): Promise<Return> => {
  const leanUser = await context.collection.functions.get({
    filters: {
      _id: user._id,
    },
    populate: ['picture'],
  })

  if( !leanUser ) {
    throw new Error()
  }

  const tokenContent = {
    user: {
      _id: leanUser._id,
      roles: leanUser.roles,
    },
  }

  if( context.apiConfig.logSuccessfulAuthentications ) {
    await context.log('successful authentication', {
      email: leanUser.email,
      roles: leanUser.roles,
      _id: leanUser._id,
    })
  }

  if( context.apiConfig.tokenUserProperties ) {
    const pick = (obj: any, properties: string[]) => properties.reduce((a, prop) => {
      if( 'prop' in obj ) {
        return a
      }

      return {
        ...a,
        [prop]: obj[prop],
      }
    }, {})

    Object.assign(leanUser, pick(leanUser, context.apiConfig.tokenUserProperties))
    Object.assign(tokenContent.user, leanUser)
  }

  const token = await signToken(tokenContent)

  return {
    user: leanUser,
    token: {
      type: 'bearer',
      content: token,
    },
  }
}

export const authenticate = async (props: Props, context: Context<typeof description>) => {
  if( 'revalidate' in props ) {
    return context.token.authenticated
      ? right(await getUser(context.token.user, context))
      : left(AuthenticationErrors.Unauthenticated)
  }

  if( typeof props.email !== 'string' ) {
    return left(AuthenticationErrors.InvalidCredentials)
  }

  if(
    props.email === process.env.GODMODE_USERNAME
  && props.password === process.env.GODMODE_PASSWORD
  ) {
    const token = await signToken({
      user: {
        _id: null,
        roles: ['root'],
      },
    })

    return right(<Return>{
      user: {
        _id: null,
        full_name: 'God Mode',
        email: '',
        roles: ['root'],
        active: true,
      },
      token: {
        type: 'bearer',
        content: token,
      },
    })
  }

  const user = await context.collection.model.findOne({
    email: props.email,
  },
  {
    email: 1,
    password: 1,
    active: 1,
  })

  if( !user || !user.password || !await bcryptCompare(props.password, user.password) ) {
    return left(AuthenticationErrors.InvalidCredentials)
  }

  if( !user.active ) {
    return left(AuthenticationErrors.InactiveUser)
  }

  return right(await getUser(user, context))
}
