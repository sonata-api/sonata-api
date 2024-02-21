import type { Description } from '@sonata-api/types'

export const plainCandidate = {
  name: 'Terry',
  age: 50,
}

export const plainDescription = {
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
} satisfies Omit<Description, '$id'> 

