import type { Context, Schema } from '@sonata-api/types'
import type { description } from './description.js'
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
      'phone_number',
    ],
    properties: {
      name: {
        type: 'string',
      },
      email: {
        type: 'string',
      },
      phone_number: {
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

  return right(newUser)
}

