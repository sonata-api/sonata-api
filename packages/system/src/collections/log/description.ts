import { defineDescription } from '@sonata-api/api'

export const [Log, description] = defineDescription({
  $id: 'log',
  required: [
    'context',
    'message'
  ],
  properties: {
    owner: {
      // don't use "owned: true", we want it this way
      $ref: 'user'
    },
    context: {
      type: 'string'
    },
    message: {
      type: 'string'
    },
    details: {
      type: 'object'
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    }
  },
  icon: 'search-alt',
  presets: [
    'view'
  ],
  filters: [
    'context',
    'message',
    'owner'
  ]
})
