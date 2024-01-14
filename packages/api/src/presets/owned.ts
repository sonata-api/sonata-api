import type { JsonSchema } from '@sonata-api/types'

export const owned = <const>{
  properties: {
    owner: {
      $ref: 'user',
      noForm: true,
    },
  },
} satisfies Pick<JsonSchema, 'properties'>
