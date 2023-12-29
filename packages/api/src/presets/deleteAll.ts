import type { Description } from '@sonata-api/types'

export const deleteAll = <const>{
  actions: {
    removeAll: {
      name: 'action.removeAll',
      ask: true,
      selection: true,
      translate: true
    }
  }
} satisfies Pick<Description, 'actions'>
