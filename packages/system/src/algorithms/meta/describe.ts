import type { Context, Collection } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import { createContext, getResources, preloadDescription } from '@sonata-api/api'
import { serialize, isLeft, left, unwrapEither, Either } from '@sonata-api/common'
import { default as authenticate } from '../../collections/user/authenticate'

type Props = {
  collections?: Array<string>
  noSerialize?: boolean
  roles?: boolean
  revalidate?: boolean
}

const describe = async (props: Props | undefined, context: Context): Promise<any> => {
  const result = {} as {
    descriptions: typeof descriptions
    roles?: typeof context.accessControl.roles
    auth?: Awaited<ReturnType<typeof authenticate>> extends Either<infer _Left, infer Right>
      ? Partial<Right>
      : never
  }

  if( props?.revalidate ) {
    const authEither  = await authenticate({ revalidate: true }, await createContext({
      resourceName: 'user',
      parentContext: context
    }) as any)

    if( isLeft(authEither) ) {
      const error = unwrapEither(authEither)
      return left(error)
    }

    const auth = unwrapEither(authEither)
    result.auth = {
      token: auth.token
    }
  }

  const resources = await getResources()

  const collections = (props?.collections?.length
    ? Object.entries(resources.collections).filter(([key]) => props.collections!.includes(key)).map(([, value]) => value)
    : Object.values(resources.collections)) as Array<Collection>

  const descriptions: Record<string, Description> = {}
  result.descriptions = descriptions

  for( const collection of collections ) {
    const { description: rawDescription } = await collection()
    const description = await preloadDescription(rawDescription)
    descriptions[description.$id] = description
  }

  if( props?.roles ) {
    result.roles = context.accessControl.roles
  }

  if( props?.noSerialize ) {
    return result
  }

  context.response.setHeader('content-type', 'application/bson')
  return context.response.end(serialize(result))
}

export default describe
