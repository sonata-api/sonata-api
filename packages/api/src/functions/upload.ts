import type { Context } from '@sonata-api/types'
import { isLeft, unwrapEither, left } from '@sonata-api/common'
import { validate, validator } from '@sonata-api/validation'

import path from 'path'
import { createWriteStream } from 'fs'
import { createHash } from 'crypto'

const [FileMetadata, validateFileMetadata] = validator({
  type: 'object',
  properties: {
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

  if( !context.apiConfig.storage?.tempFs ) {
    throw new Error()
  }

  const absolutePath = path.join(context.apiConfig.storage.tempFs, `${filenameHash}.${extension}`)

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

  const path = await streamToFs(metadata, context)
  const file = await context.collections.tempFile.model.insertOne({
    created_at: new Date(),
    absolute_path: path,
    size: context.request.headers['content-length'],
    mime: context.request.headers['content-type'],
    collection: context.description.$id,
    filename: metadata.filename,
  })

  return {
    tempId: file.insertedId,
  }
}

