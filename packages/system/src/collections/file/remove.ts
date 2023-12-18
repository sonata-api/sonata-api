import type { Context } from '@sonata-api/types'
import { unlink } from 'fs/promises'
import { useFunctions } from '@sonata-api/api'
import { description, type File } from './description'

type Props = {
  filters: {
    _id: any
  }
}

const remove = async (props: Props, context: Context<typeof description>) => {
  const { remove } = useFunctions<File>()()

  const file = await context.collection.functions.get({
    filters: props.filters,
    project: [
      'absolute_path'
    ]
  })

  if( !file ) {
    throw new Error('file not found')
  }

  if( file.absolute_path ) {
    await unlink(file.absolute_path).catch(() => null)
  }
  return remove(props, context)
}

export default remove
