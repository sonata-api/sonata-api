import type { Description } from '@sonata-api/types'

export const view = <const>{
  individualActions: {
    'ui:spawnView': {
      name: 'action.view',
      icon: 'magnifying-glass-plus',
      translate: true,
    },
  },
} satisfies Pick<Description, 'individualActions'>
