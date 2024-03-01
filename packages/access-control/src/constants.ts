import type { AccessControl } from '@sonata-api/types'

export const DEFAULT_ACCESS_CONTROL = <const>{
  roles: {
    root: {
      grantEverything: true,
    },
  },
} satisfies AccessControl
