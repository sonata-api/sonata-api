import type { Property } from '@sonata-api/types'

export const coercionDescription = {
  type: 'object',
  properties: {
    id: {
      type: 'number'
    }
  }
} satisfies Property
