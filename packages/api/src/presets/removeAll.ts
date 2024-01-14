import type { Description } from '@sonata-api/types'

export const removeAll = <const>{
  actions: {
    removeAll: {
      name: 'action.removeAll',
      ask: true,
      selection: true,
      translate: true,
    },
  },
} satisfies Pick<Description, 'actions'>
