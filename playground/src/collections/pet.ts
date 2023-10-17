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

export default defineCollection(() => ({
  item: Pet,
  description,
  functions: {
    bark: (person: string) => `Bark! *Bites ${person}*`,
    addPerson: async (_arg: null, context: Context<typeof description>) => {
      // await context.collections.person.functions.insert({
      //   what: {
      //     name: `Person nº ${Math.round(Math.random()*10)}`,
      //     job: 'baker'
      //   }
      // })

      // const result = await context.collections.person.functions.getAll({
      //   filters: {
      //     job: 'baker'
      //   }
      // })

      // return result
    },
  }
}))
