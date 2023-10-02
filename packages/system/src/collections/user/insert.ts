import { type Context, type WithId, useFunctions } from '@sonata-api/api'
import * as bcrypt from 'bcrypt'
import { description, type User } from './description'

type Props = {
  what: WithId<Partial<User>>
}

const insert = async (props: Props, context: Context<typeof description>) => {
  const { token, apiConfig } = context
  props.what.group = apiConfig.group

  // user is being inserted by a non-root user
  if( !token?.user?.roles.includes('root') ) {
    const userId = props.what._id = token?.user?._id
    delete props.what.roles

    // a new user is being created
    if( !userId ) {
      if( !apiConfig.allowSignup ) {
        throw new Error(
          `signup is not allowed`
        )
      }

      props.what.self_registered = true

      if( apiConfig.signupDefaults ) {
        Object.assign(props.what, apiConfig.signupDefaults)
      }
    }
  }

  if( !token?.user && !props.what.password ) {
    throw new Error(
      `password is required`
    )
  }

  if( props.what.password ) {
    props.what.password = await bcrypt.hash(props.what.password, 10)
  }

  if( props.what.password === null ) {
    delete props.what.password
  }

  const { insert } = useFunctions<User>()()
  return insert(props, context)
}

export default insert
