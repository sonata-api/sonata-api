import { defineCollection, defineDescription, useFunctions } from 'sonata-api'

const [Person, description] = defineDescription({
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

export const person = defineCollection(() => ({
  item: Person,
  description,
  functions: useFunctions<typeof Person>()([
    'getAll',
    'insert'
  ]),
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
}))

