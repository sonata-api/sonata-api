import { defineCollection, defineDescription } from 'sonata-api'

const description = defineDescription({
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

export const pet = defineCollection({
  description
})
