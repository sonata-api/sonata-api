import { init, makeRouter, validateSilently } from 'sonata-api'
export * as collections from './collections'

const router = makeRouter({
  exhaust: true
})

router.GET('/hello-world', () => 'hello, world!')

router.GET('/get-people', async (context) => {
  const query = await validateSilently(context.request.query, {
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

  await context.collections.person.functions.insert({
    what: {
      name: query.name,
      job: 'programmer'
    },
  })

  return context.collections.person.functions.getAll({})
})

init({}, (context) => {
  return router.install(context)
})
