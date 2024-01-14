import type { Description } from '@sonata-api/types'

export const remove = <const>{
  individualActions: {
    remove: {
      name: 'action.remove',
      icon: 'trash-alt',
      ask: true,
      translate: true,
    },
  },
} satisfies Pick<Description, 'individualActions'>
