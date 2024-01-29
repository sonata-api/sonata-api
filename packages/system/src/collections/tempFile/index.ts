import { defineCollection } from '@sonata-api/api'

export const tempFile = defineCollection({
  description: {
    $id: 'tempFile',
    temporary: {
      index: 'created_at',
      expireAfterSeconds: 3600
    },
    properties: {
      created_at: {
        type: 'string',
        format: 'date-time'
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
