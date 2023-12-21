import { defineCollection } from 'sonata-api'

export const petToy = defineCollection({
  description: {
    $id: 'petToy',
    properties: {
      name: {
        type: 'string'
      },
      brand: {
        enum: [
          'dogs choice',
          'the pet company',
        ]
      }
    }
  }
})
