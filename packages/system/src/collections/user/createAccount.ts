import { type Context } from '@sonata-api/api'
import { sendTransactionalEmail  } from '@sonata-api/mailing'
import { left, isLeft } from '@sonata-api/common'
import { description, type User } from './description'
import bcrypt from 'bcrypt'

type Props = Omit<User, 'roles'>

const createAccount = async (props: Props, context: Context<typeof description>) => {
  const user = Object.assign({}, props)

  if( !context.apiConfig.allowSignup ) {
    return left('signup disallowed')
  }

  const validationEither = await context.validate({
    required: [
      'full_name',
      'email',
      'phone'
    ],
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
    extraneous: [
      '_id',
      'roles',
      'active'
    ]
  })

  if( isLeft(validationEither) ) {
    return validationEither
  }

  if( context.apiConfig.group ) {
    user.group = context.apiConfig.group
  }

  if( context.apiConfig.signupDefaults ) {
    Object.assign(user, context.apiConfig.signupDefaults)
  }

  if( user.password ) {
    user.password = await bcrypt.hash(user.password, 10)
  }

  if( !context.token.user._id ) {
    user.self_registered = true
  }

  const newUser = await context.model.insertOne(user as any)
  const activationToken = await bcrypt.hash(newUser.insertedId.toString(), 10)
  const link = `${process.env.API_URL}/user/activate?u=${newUser.insertedId.toString()}&t=${activationToken}`

  await sendTransactionalEmail({
    receiverName: user.full_name,
    receiverEmail: user.email,
    subject: 'Falta pouco para completar o seu cadastro',
    html: `<div>
      <div>Clique no link abaixo ou copie e cole na barra do navegador para ativar o seu usuário</div>
      <a href="${link}">${link}</a>
    </div>`
  })


  return newUser
}

export default createAccount
