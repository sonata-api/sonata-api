import { defineCollection, get } from '@sonata-api/api'
import { description } from './description'
import { insert } from './insert'
import { download } from './download'

export const tempFile = defineCollection({
  description: {
    $id: 'tempFile',
    temporary: {
      index: 'created_at',
      expireAfterSeconds: 3600,
    },
    properties: {
      created_at: {
        type: 'string',
        format: 'date-time',
      },
      absolute_path: {
        type: 'string',
      },
      size: {
        type: 'number',
      },
      mime: {
        type: 'number',
      },
      collection: {
        type: 'string',
      },
      filename: {
        type: 'string',
      },
    },
  },
})

export const file = defineCollection({
  description,
  functions: {
    get,
    insert,
    download,
  },
})

