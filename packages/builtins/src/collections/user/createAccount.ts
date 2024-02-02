import type { Context, Schema } from '@sonata-api/types'
import type { description } from './description'
import { sendTransactionalEmail } from '@sonata-api/mailing'
import { isLeft, unwrapEither, left, right } from '@sonata-api/common'
import { validate } from '@sonata-api/validation'
import bcrypt from 'bcrypt'

export const createAccount = async (payload: Omit<Schema<typeof description>, 'roles'>,
  context: Context<typeof description>) => {
  const user = Object.assign({}, payload)

  if( !context.apiConfig.allowSignup ) {
    throw new Error('signup disallowed')
  }

  const validationEither = validate(user, {
    type: 'object',
    required: [
      'name',
      'email',
      'phone',
    ],
    properties: {
      name: {
        type: 'string',
      },
      email: {
        type: 'string',
      },
      phone: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
  }, {
    extraneous: [
      '_id',
      'roles',
      'active',
    ],
  })

  if( isLeft(validationEither) ) {
    return left(unwrapEither(validationEither))
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

  if( !context.token.authenticated ) {
    Object.assign(user, {
      self_registered: true,
    })
  }

  const { insertedId } = await context.collection.model.insertOne(user as any)
  const newUser = await context.collection.model.findOne({
    _id: insertedId,
  })

  if( !newUser ) {
    throw new Error()
  }

  const activationToken = await bcrypt.hash(insertedId.toString(), 10)
  const link = `${process.env.API_URL}/user/activate?u=${insertedId.toString()}&t=${activationToken}`

  await sendTransactionalEmail({
    receiverName: user.name,
    receiverEmail: user.email,
    subject: 'Falta pouco para completar o seu cadastro',
    html: `<div>
      <div>Clique no link abaixo ou copie e cole na barra do navegador para ativar o seu usuário</div>
      <a href="${link}">${link}</a>
    </div>`,
  })

  return right(newUser)
}

