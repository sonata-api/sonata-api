import { init, makeRouter, validate, isError, unpack } from 'sonata-api'
export * as collections from './collections'

const router = makeRouter()

router.GET('/hello-world', () => 'hello, world!')

router.GET('/get-people', async (context) => {
  const queryEither = await validate(context.request.query, {
    properties: {
      name: {
        type: 'string'
      }
    }
  })

  if( isError(queryEither) ) {
    return {
      error: true,
      details: queryEither.value
    }
  }

  const query = unpack(queryEither)
  await context.models.person.insertOne({
    name: query.name,
    job: 'programmer'
  })

  return context.models.person.find().toArray()
})

init({}, (context) => {
  return router.install(context)
})
