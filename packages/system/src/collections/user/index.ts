import { defineCollection, useFunctions } from '@sonata-api/api'
import { description, User } from './description'

import authenticate from './authenticate'
import activate from './activate'
import insert from './insert'
import createAccount from './createAccount'
import getInfo from './getInfo'

export const user = defineCollection(() => ({
  item: {} as User,
  description,
  functions: {
    ...useFunctions<User>()([
      'get',
      'getAll',
      'remove',
      'upload',
      'removeFile'
    ]),
    insert,
    authenticate,
    createAccount,
    getInfo,
    activate,
  },
  accessControl: {
    roles: {
      guest: {
        functions: [
          'authenticate'
        ]
      }
    }
  }
}))
