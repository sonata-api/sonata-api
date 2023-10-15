import { defineDescription, deepMerge, type Schema } from 'sonata-api'
import { user } from '@sonata-api/system'

const newDescription = <const>{
  required: [
    'favorite_color'
  ],
  properties: {
    favorite_color: {
      enum: [
        'blue',
        'red',
        'yellow'
      ]
    },
  }
}

const [NewUser] = defineDescription(newDescription)

export type User = Awaited<ReturnType<typeof user>>['item'] & typeof NewUser

export default () => {
  const userCollection = user()
  const description = Object.assign({}, userCollection.description) as typeof userCollection['description'] & typeof newDescription

  Object.assign(
    description,
    deepMerge(description, newDescription)
  )

  return {
    item: {} as Schema<typeof description>,
    description,
    functions: userCollection.functions
  }
}
