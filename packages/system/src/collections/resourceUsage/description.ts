import { defineDescriptionTuple } from '@sonata-api/api'

export const [ResourceUsage, description] = defineDescriptionTuple({
  $id: 'resourceUsage',
  required: [],
  properties: {
    hits: {
      type: 'integer',
    },
    last_maximum_reach: {
      type: 'string',
      format: 'date-time',
    },
  },
})

