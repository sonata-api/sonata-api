import type { Description } from '@sonata-api/types'

export const conditionalDescription: Omit<Description, '$id'> = {
  required: {
    id: true,
    name: {
      and: [
        {
          operator: 'gt',
          term1: 'id',
          term2: 0,
        },
        {
          operator: 'lt',
          term1: 'id',
          term2: 10,
        }
      ]
    }
  },
  properties: {
    id: {
      type: 'number'
    },
    name: {
      type: 'string'
    }
  }
}

