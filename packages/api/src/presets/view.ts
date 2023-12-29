import type { Description } from '@sonata-api/types'

export const view = <const>{
  individualActions: {
    'ui:spawnView': {
      name: 'action.view',
      icon: 'search-plus',
      translate: true
    }
  }
} satisfies Pick<Description, 'individualActions'>
