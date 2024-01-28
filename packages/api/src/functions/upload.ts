import type { Context, Property } from '@sonata-api/types'
import { isLeft, unwrapEither, left, getValueFromPath } from '@sonata-api/common'
import { validate, validator } from '@sonata-api/validation'

import path from 'path'
import { createWriteStream } from 'fs'
import { createHash } from 'crypto'

const [FileMetadata, validateFileMetadata] = validator({
  type: 'object',
  properties: {
    ref: {
      type: 'string',
    },
    filename: {
      type: 'string',
    },
  },
})

const streamToFs = (metadata: typeof FileMetadata, context: Context) => {
  const filenameHash = createHash('sha1')
    .update(metadata.filename + Date.now())
    .digest('hex')

  const extension = metadata.filename.includes('.')
    ? metadata.filename.split('.').pop()
    : 'bin'

  const absolutePath = path.join('/tmp', `${filenameHash}.${extension}`)

  return new Promise<string>((resolve, reject) => {
    const stream = createWriteStream(absolutePath)

    stream.on('open', () => context.request.nodeRequest.pipe(stream))
    stream.on('close', () => resolve(absolutePath))
    stream.on('error', (error) => reject(error))
  })
}

export const upload = async <TContext extends Context>(_props: unknown, context: TContext) => {
  const headersEither = validate(context.request.headers, {
    type: 'object',
    properties: {
      'x-stream-request': {
        literal: '1',
      },
      'content-type': {
        type: 'string',
      },
    },
  }, {
    extraneous: true,
  })

  if( isLeft(headersEither) ) {
    return left(unwrapEither(headersEither))
  }

  const metadataEither = validateFileMetadata(context.request.query)
  if( isLeft(metadataEither) ) {
    return left(unwrapEither(metadataEither))
  }

  const metadata = unwrapEither(metadataEither)

  const property: Property = getValueFromPath(context.description, `properties.${metadata.ref}`)
  if( !property || !('$ref' in property) || property.$ref !== 'file' ) {
    return left('invalid property')
  }

  const path = await streamToFs(metadata, context)
  const file = await context.collections.fileTemp.model.insertOne({
    absolute_path: path,
    size: context.request.headers['content-length'],
    collection: context.description.$id,
    ref: metadata.ref,
    filename: metadata.filename,
  })

  return {
    path,
    id: file.insertedId,
  }
}

