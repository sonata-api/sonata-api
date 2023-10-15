import type { Context, Collection } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import { createContext, getCollections, preloadDescription } from '@sonata-api/api'
import { serialize, isLeft, left, unwrapEither, Either } from '@sonata-api/common'
import { getAvailableRoles } from '@sonata-api/access-control'
import { default as authenticate } from '../collections/user/authenticate'

type Props = {
  collections?: Array<string>
  noSerialize?: boolean
  roles?: boolean
  revalidate?: boolean
}

export const describe = async (context: Context): Promise<any> => {
  const result = {} as {
    descriptions: typeof descriptions
    roles?: string[]
    auth?: Awaited<ReturnType<typeof authenticate>> extends Either<infer _Left, infer Right>
      ? Partial<Right>
      : never
  }

  const props = context.request.payload as Props

  if( props?.revalidate ) {
    const authEither  = await authenticate({ revalidate: true }, await createContext({
      collectionName: 'user',
      parentContext: context,
    }) as any)

    if( isLeft(authEither) ) {
      const error = unwrapEither(authEither)
      return left(error)
    }

    const auth = unwrapEither(authEither)
    result.auth = JSON.parse(JSON.stringify(auth))
  }

  const collections = await getCollections()

  const retrievedCollections = (props?.collections?.length
    ? Object.entries(collections).filter(([key]) => props.collections!.includes(key)).map(([, value]) => value)
    : Object.values(collections)) as Array<Collection>

  const descriptions: Record<string, Description> = {}
  result.descriptions = descriptions

  for( const collection of retrievedCollections ) {
    const { description: rawDescription } = await collection()
    const description = await preloadDescription(rawDescription)
    descriptions[description.$id] = description
  }

  if( props?.roles ) {
    result.roles = await getAvailableRoles()
  }

  if( props?.noSerialize ) {
    return result
  }

  context.response.setHeader('content-type', 'application/bson')
  return context.response.end(serialize(result))
}
