import { defineCollection, defineDescription } from 'sonata-api'

const [Pet, description] = defineDescription({
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
})

export const pet = defineCollection(() => ({
  item: Pet,
  description
}))
