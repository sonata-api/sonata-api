import { unlink } from 'fs/promises'
import { type Context, useFunctions } from '@sonata-api/api'
import { description, type File } from './description'

type Props = {
  filters: {
    _id: string
  }
}

const remove = async (props: Props, context: Context<typeof description>) => {
  const { remove } = useFunctions<File>()()
  const file = await context.collection.functions.get(props, context)
  if( !file ) {
    throw new Error('file not found')
  }

  await unlink(file.absolute_path!).catch(() => null)
  return remove(props, context)
}

export default remove
