import { type Context, sendTransactionalEmail } from '@sonata-api/api'
import { isLeft, unwrapEither } from '@sonata-api/common'
import { description, type User } from './description'
import bcrypt from 'bcrypt'

type Props = Partial<User>

const createAccount = async (props: Props, context: Context<typeof description>) => {
  const user = Object.assign({}, props)

  const validationEither = await context.validate({
    properties: {
      full_name: {
        type: 'string'
      },
      email: {
        type: 'string'
      },
      phone: {
        type: 'string'
      },
      password: {
        type: 'string'
      }
    }
  }, user, {
    required: [
      'full_name',
      'email',
      'phone'
    ],
    extraneous: [
      '_id',
      'roles',
      'active'
    ]
  })

  if( isLeft(validationEither) ) {
    return validationEither
  }

  user.group = context.apiConfig.group

  if( user.password ) {
    user.password = await bcrypt.hash(user.password, 10)
  }

  if( !context.token.user._id ) {
    user.self_registered = true
  }

  const newUser = await context.model.create(user)
  const activationToken = await bcrypt.hash(newUser._id.toString(), 10)
  const link = `${process.env.API_URL}/user/activate?u=${newUser._id}&t=${activationToken}`

  await sendTransactionalEmail({
    receiverName: newUser.full_name,
    receiverEmail: newUser.email,
    subject: 'Sua senha aew, papai',
    html: `<div>
      <div>Clique no link abaixo ou copie e cole na barra do navegador para ativar o seu usuário</div>
      <a href="${link}">${link}</a>
    </div>`
  })


  return newUser

  // user is being inserted by a non-root user
  // if( !token?.user?.roles.includes('root') ) {
  //   const userId = props.what._id = token?.user?._id
  //   delete props.what.roles

  //   // a new user is being created
  //   if( !userId ) {
  //     if( !apiConfig.allowSignup ) {
  //       throw new Error(
  //         `signup is not allowed`
  //       )
  //     }

  //     props.what.self_registered = true

  //     if( apiConfig.signupDefaults ) {
  //       Object.assign(props.what, apiConfig.signupDefaults)
  //     }
  //   }
  // }

  // if( !token?.user && !props.what.password ) {
  //   throw new Error(
  //     `password is required`
  //   )
  // }

  // if( props.what.password ) {
  //   props.what.password = await bcrypt.hash(props.what.password, 10)
  // }

  // if( props.what.password === null ) {
  //   delete props.what.password
  // }

  // const { insert } = useFunctions<User>()()
  // try {
  //   const r = await insert(props, context)
  //   return r
  // } catch( e ) {
  //   console.trace(e)
  // }
}

export default createAccount
