import { defineCollection, defineDescription, isLeft, unwrapEither } from 'sonata-api'

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

export default defineCollection(() => ({
  item: Pet,
  description,
  functions: {
    bark: (person: string) => `Bark! *Bites ${person}*`,
    addPerson: async (_arg: null, context: Context<typeof description>) => {
      const personEither = await context.collections.person.functions.insert({
        what: {
          name: `Person nº ${Math.round(Math.random()*10)}`,
          job: 'baker'
        }
      })

      if( isLeft(personEither) ) {
        return unwrapEither(personEither)
      }

      const person = unwrapEither(personEither)
      console.log(person.name)
      console.log(person.job)

      return context.collections.person.functions.getAll({
        filters: {
          job: 'baker'
        }
      })
    },
  }
}))
