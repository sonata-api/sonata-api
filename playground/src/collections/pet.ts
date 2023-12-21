import { defineCollection } from 'sonata-api'

export const pet = defineCollection({
  description: {
    $id: 'pet',
    properties: {
      name: {
        type: 'string'
      },
      toys: {
        type: 'object',
        properties: {
          favorite: {
            $ref: 'petToy'
          },
        }
      }
    }
  }
})

