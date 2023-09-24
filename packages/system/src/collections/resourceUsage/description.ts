import { defineDescription } from '@sonata-api/api'

export const [ResourceUsage, description] = defineDescription({
  $id: 'resourceUsage',
  required: [],
  properties: {
    hits: {
      type: 'integer'
    },
    last_maximum_reach: {
      type: 'string',
      format: 'date-time'
    }
  }
})

