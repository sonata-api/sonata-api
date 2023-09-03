import { useFunctions } from '@sonata-api/api'
import { description, User } from './description'
import model from './model'

import authenticate from './authenticate'
import activate from './activate'
import insert from './insert'
import createAccount from './createAccount'
import getInfo from './getInfo'
import ping from './ping'

export { schemaCallback as userSchemaCallback } from './model'

export const user = () => ({
  item: User,
  description,
  model,
  functions: {
    ...useFunctions<typeof User>()([
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
    ping,
  }
})
