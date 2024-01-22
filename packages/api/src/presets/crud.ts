import type { Description } from '@sonata-api/types'

export const crud = <const>{
  actions: {
    'ui:spawnAdd': {
      name: 'action.add',
      icon: 'plus',
      translate: true,
      button: true,
    },
  },
  individualActions: {
    'ui:spawnEdit': {
      name: 'action.edit',
      icon: 'pencil-simple',
      translate: true,
    },
    'remove': {
      name: 'action.remove',
      icon: 'trash',
      ask: true,
      translate: true,
    },
  },
} satisfies Pick<Description, 'actions' | 'individualActions'>
