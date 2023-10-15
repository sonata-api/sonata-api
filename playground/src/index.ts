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

  await context.models.person.insertOne({
    name: query.name,
    job: 'programmer'
  })

  return context.models.person.find().toArray()
})

init({}, (context) => {
  return router.install(context)
})
