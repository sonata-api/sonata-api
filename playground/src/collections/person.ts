import { defineCollection, defineDescription, getAll, insert } from 'sonata-api'

const description = defineDescription({
  $id: 'person',
  required: [],
  properties: {
    name: {
      type: 'string'
    },
    job: {
      enum: [
        'driver',
        'baker',
        'programmer',
        'policeman'
      ]
    },
    pets: {
      type: 'array',
      items: {
        $ref: 'pet'
      }
    }
  }
})

export const person = defineCollection({
  description,
  functions: {
    getAll,
    insert,
  },
  accessControl: {
    roles: {
      root: {
        grantEverything: true
      },
      guest: {
        inherit: [
          'root'
        ]
      }
    }
  }
})

