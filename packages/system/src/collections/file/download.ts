import { readFile } from 'fs/promises'
import { type Context, useFunctions } from '@sonata-api/api'
import { description, type File } from './description'

const download = async (_id: string, context: Context<typeof description>) => {
  const { get } = useFunctions<File>()()
  const file = await get({
    filters: {
      _id,
    },
    project: [
      'absolute_path'
    ]
  }, context)

  if( !file ) {
    throw new Error('file not found')
  }

  const content = await readFile(file.absolute_path!) as unknown

  return {
    ...file,
    content: Buffer.from(content as string, 'base64')
  }
}

export default download
