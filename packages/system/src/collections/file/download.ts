import type { Context } from '@sonata-api/api'
import { readFile } from 'fs/promises'
import { left } from '@sonata-api/common'
import { description } from './description'

const download = async (_id: string, context: Context<typeof description>) => {
  const file = await context.model.findOne(
    { _id },
    { absolute_path: 1 }
  )

  if( !file ) {
    return left('FILE_NOT_FOUND')
  }

  file.content = await readFile(file.absolute_path)
  return file
}

export default download
