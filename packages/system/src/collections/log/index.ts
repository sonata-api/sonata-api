import { defineCollection, get, getAll, insert } from '@sonata-api/api'

export const log = defineCollection({
  description: {
    $id: 'log',
    required: [
      'context',
      'message',
    ],
    properties: {
      owner: {
      // don't use "owned: true", we want it this way
        $ref: 'user',
        noForm: true,
      },
      context: {
        type: 'string',
      },
      message: {
        type: 'string',
      },
      details: {
        type: 'object',
      },
      created_at: {
        type: 'string',
        format: 'date-time',
      },
    },
    icon: 'magnifying-glass',
    presets: ['view'],
    filters: [
      'context',
      'message',
      'owner',
    ],
  },
  functions: {
    get,
    getAll,
    insert,
  },
})
