import { defineCollection, defineDescription } from 'sonata-api'

const [Pet, description] = defineDescription({
  $id: 'pet',
  properties: {
    name: {
      type: 'string'
    },
    favorite_toy: {
      type: 'string'
    },
  }
})

export const pet = defineCollection(() => ({
  item: Pet,
  description
}))
