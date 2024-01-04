import { init, makeRouter, isLeft, unwrapEither, leftSchema } from 'sonata-api'
export * as collections from './collections'

const router = makeRouter({
  exhaust: true
})

router.GET('/get-people', async (context) => {
  const personEither = await context.collections.person.functions.insert({
    what: {
      name: context.request.payload.name,
      job: 'programmer'
    },
  })

  if( isLeft(personEither) ) {
    return personEither
  }

  const person = unwrapEither(personEither)
  console.log(person.name)
  console.log(person.job)

  if( person.pets ) {
    for( const pet of person.pets ) {
      console.log(pet.name)
      console.log(pet.toys.favorite.name)
      console.log(pet.toys.favorite.brand)
    }
  }

  return context.collections.person.functions.getAll()
}, [
  {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      }
    }
  },
  [
    leftSchema({
      type: 'object'
    }),
    {
      type: 'array',
      items: {
        $ref: 'person'
      }
    },
  ]
])


init({}, (context) => {
  return router.install(context)
})
