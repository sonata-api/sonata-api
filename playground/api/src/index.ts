import { initWithDatabase, defineAccessControl } from 'sonata-api'

import person from './collections/person'
import pet from './collections/pet'
import user from './collections/user'

import hello from './algorithms/hello'

export const collections = {
  person,
  pet,
  user
}

export const algorithms = {
  hello
}

export const accessControl = defineAccessControl<Collections, Algorithms>()({
  roles: {
    guest: {
      capabilities: {
        person: {
          functions: [
            'getAll'
          ]
        },
        hello: {
          functions: [
            'world'
          ]
        }
      }
    }
  }   
})({
  write: async (context, props) => {
    const { resourceName, token } = context
    const payload = Object.assign({}, props.payload)

    if( resourceName === 'person' && token.user.roles.includes('guest') ) {
      payload.what.name = `Modified: ${payload.what.name}`
    }

    return payload
  }
})

initWithDatabase().then(async (server) => {
  server.start()
})

