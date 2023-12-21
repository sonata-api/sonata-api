import { defineCollection, getAll, insert } from 'sonata-api'

export const person = defineCollection({
  description: {
    $id: 'person',
    required: [],
    properties: {
      name: {
        type: 'string',
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
  },
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
        ],
        grant: [
          'getAll'
        ]
      }
    }
  }
})

