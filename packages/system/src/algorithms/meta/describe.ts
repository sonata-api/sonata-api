import type { Description } from '@sonata-api/types'
import { type Context, type Collection, getResources, preloadDescription } from '@sonata-api/api'
import { serialize } from '@sonata-api/common'

type Props = {
  collections?: Array<string>
  noSerialize?: boolean
  roles?: boolean
}

const describe = async (props: Props, context: Context): Promise<any> => {
  const resources = await getResources()

  const collections = (props?.collections?.length
    ? Object.entries(resources.collections).filter(([key]) => props.collections!.includes(key)).map(([, value]) => value)
    : Object.values(resources.collections)) as Array<Collection>

  const descriptions: Record<string, Description> = {}
  for( const collection of collections ) {
    const { description: rawDescription } = await collection()
    const description = await preloadDescription(rawDescription)
    descriptions[description.$id] = description
  }

  const result: {
    descriptions: typeof descriptions
    roles?: typeof context.accessControl.roles
  } = {
    descriptions,
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
