import type { Context, SchemaWithId } from '@sonata-api/types'
import type { description } from './description'
import { createHash } from 'crypto'
import { writeFile, unlink } from 'fs/promises'
import { insert as originalInsert } from '@sonata-api/api'

type Props = {
  what: { content: string } & Pick<SchemaWithId<typeof description>,
    | '_id'
    | 'filename'
    | 'owner'
    | 'absolute_path'
  >
}

export const insert = async (props: Props, context: Context<typeof description>) => {
  if( !context.token.authenticated ) {
    throw new Error('')
  }

  const what = Object.assign({}, props.what)
  what.owner = context.token.user._id
  const { STORAGE_PATH } = process.env

  const extension = what.filename?.split('.').pop()
  if( !extension ) {
    throw new Error('filename lacks extension')
  }

  const oldFile = await context.collection.model.findOne({
    _id: props.what._id,
  },
  {
    absolute_path: 1,
  })

  if( oldFile && oldFile.absolute_path ) {
    await unlink(oldFile.absolute_path).catch(console.trace)
  }

  const filenameHash = createHash('sha1')
    .update(what.filename! + Date.now())
    .digest('hex')

  what.absolute_path = `${STORAGE_PATH}/${filenameHash}.${extension}`
  await writeFile(what.absolute_path, Buffer.from(what.content.split(',').pop()!, 'base64'))

  return originalInsert({
    ...props,
    what,
  }, context)
}
