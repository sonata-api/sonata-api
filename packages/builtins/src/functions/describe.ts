import type { Context, Either } from '@aeriajs/types'
import type { Description } from '@aeriajs/types'
import { createContext, preloadDescription } from '@aeriajs/api'
import { getCollections, getRouter } from '@aeriajs/entrypoint'
import { serialize, isLeft, left, unwrapEither } from '@aeriajs/common'
import { getAvailableRoles } from '@aeriajs/access-control'
import { authenticate } from '../collections/user/authenticate.js'

type Payload = {
  collections?: string[]
  noSerialize?: boolean
  roles?: boolean
  revalidate?: boolean
  router?: boolean
}

export const describe = async (context: Context): Promise<any> => {
  const result = {} as {
    descriptions: typeof descriptions
    roles?: string[]
    auth?: Awaited<ReturnType<typeof authenticate>> extends Either<unknown, infer Right>
      ? Partial<Right>
      : never
    router?: any
  }

  const props: Payload = context.request.payload

  if( props.revalidate ) {
    const authEither = await authenticate({
      revalidate: true,
    }, await createContext({
      collectionName: 'user',
      parentContext: context,
    }))

    if( isLeft(authEither) ) {
      const error = unwrapEither(authEither)
      return left(error)
    }

    const auth = unwrapEither(authEither)
    result.auth = JSON.parse(JSON.stringify(auth))
  }

  const collections = await getCollections()

  const retrievedCollections = props.collections?.length
    ? Object.fromEntries(Object.entries(collections).filter(([key]) => props.collections!.includes(key)))
    : collections

  const descriptions: Record<string, Description> = {}
  result.descriptions = descriptions

  for( const collectionName in retrievedCollections ) {
    const candidate = retrievedCollections[collectionName]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    const { description: rawDescription } = collection
    const description = await preloadDescription(rawDescription)
    descriptions[description.$id] = description
  }

  if( props.roles ) {
    result.roles = await getAvailableRoles()
  }

  if( props.router ) {
    const router = await getRouter()
    result.router = router.routesMeta
  }

  if( props.noSerialize ) {
    return result
  }

  context.response.setHeader('content-type', 'application/bson')
  return context.response.end(serialize(result))
}

