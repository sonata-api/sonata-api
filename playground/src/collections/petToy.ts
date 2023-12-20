import { defineCollection, defineDescription } from 'sonata-api'

const description = defineDescription({
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
})

export const petToy = defineCollection({
  description
})
