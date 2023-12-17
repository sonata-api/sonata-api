import { init, makeRouter, validateSilently, isLeft, unwrapEither } from 'sonata-api'
export * as collections from './collections'

const router = makeRouter({
  exhaust: true
})

router.GET('/get-people', async (context) => {
  const query = validateSilently(context.request.query, {
    properties: {
      name: {
        type: 'string'
      }
    }
  })

  if( !query ) {
    return {
      error: true
    }
  }

  const personEither = await context.collections.person.functions.insert({
    what: {
      name: query.name,
      job: 'programmer'
    },
  })

  if( isLeft(personEither) ) {
    return unwrapEither(personEither)
  }

  const person = unwrapEither(personEither)
  console.log(person.name)
  console.log(person.job)

  if( person.pets ) {
    for( const pet of person.pets ) {
      console.log(pet.name)
      console.log(pet.favorite_toy)
    }
  }

  return context.collections.person.functions.getAll({})
})

init({}, (context) => {
  return router.install(context)
})
