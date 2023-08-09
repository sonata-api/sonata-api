import { type Context, getResources, getResourceAsset, preloadDescription } from '@sonata-api/api'
import { serialize } from '@sonata-api/common'

type Props = {
  collections?: Array<string>
  noSerialize?: boolean
  roles?: boolean
}

const describe = async (props: Props, context: Context): Promise<any> => {
  const resources = await getResources()

  const collections = props?.collections?.length
    ? Object.entries(resources.collections).filter(([key]) => props.collections!.includes(key)).map(([, value]) => value)
    : Object.values(resources.collections)

  const descriptions = Object.fromEntries(
    await Promise.all(collections.map(async (collection: any) => {
      const { description: rawDescription } = await collection()
      const description = await preloadDescription(rawDescription)
      await getResourceAsset(description.$id, 'model')

      return [description.$id, description]
    }))
  )

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

  return context.h
    .response(serialize(result))
    .header('content-type', 'application/bson')
}

export default describe
