import type { Property } from '@sonata-api/types'

export const coercionDescription = {
  type: 'object',
  properties: {
    age: {
      type: 'integer',
    },
    weight: {
      type: 'number',
    },
  },
} satisfies Property
