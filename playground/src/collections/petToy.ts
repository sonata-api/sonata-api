import { defineCollection, defineDescription } from 'sonata-api'

const [PetToy, description] = defineDescription({
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

export const petToy = defineCollection(() => ({
  item: PetToy,
  description
}))
