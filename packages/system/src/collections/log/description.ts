import { defineDescriptionTuple } from '@sonata-api/api'

export const [Log, description] = defineDescriptionTuple({
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
  icon: 'search-alt',
  presets: ['view'],
  filters: [
    'context',
    'message',
    'owner',
  ],
})
