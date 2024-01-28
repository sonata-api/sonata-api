import type { Context } from '@sonata-api/types'
import type { description } from './description'
import { unlink } from 'fs/promises'
import { functions } from '@sonata-api/api'

type Props = {
  filters: {
    _id: any
  }
}

export const remove = async (props: Props, context: Context<typeof description>) => {
  const file = await context.collection.model.findOne(props.filters, {
    projection: {
      absolute_path: 1,
    },
  })

  if( !file ) {
    throw new Error()
  }

  if( file.absolute_path ) {
    await unlink(file.absolute_path).catch(() => null)
  }

  return functions.remove(props, context)
}

