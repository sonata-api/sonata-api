import type { Description } from '@sonata-api/types'

export const duplicate = <const>{
  individualActions: {
    'ui:duplicate': {
      name: 'action.duplicate',
      icon: 'copy',
      translate: true,
    },
  },
} satisfies Pick<Description, 'individualActions'>
