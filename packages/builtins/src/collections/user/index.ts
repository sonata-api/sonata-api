import { defineCollection, get, getAll, remove, upload, removeFile } from '@sonata-api/api'
import { description } from './description'
import { authenticate } from './authenticate'
import { activate } from './activate'
import { insert } from './insert'
import { createAccount } from './createAccount'
import { getInfo } from './getInfo'
import { getActivationLink } from './getActivationLink'

export const user = defineCollection({
  description,
  functions: {
    get,
    getAll,
    remove,
    upload,
    removeFile,
    insert,
    authenticate,
    activate,
    createAccount,
    getInfo,
    getActivationLink,
  },
  accessControl: {
    roles: {
      root: {
        grantEverything: true,
      },
      guest: {
        grant: ['authenticate'],
      },
    },
  },
})

