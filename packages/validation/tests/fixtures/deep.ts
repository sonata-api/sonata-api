import type { Description } from '@sonata-api/types'

export const deepCandidate = {
  status: [
    {
      user_id: 'test',
      status: 'running',
    },
    {
      user_id: 'test',
      status: 'pending',
    },
  ],
  style: {
    color: {
      name: {
        name: 'red',
      },
    },
  },
} satisfies Omit<Description, '$id'> 

export const deepDescription = {
  properties: {
    status: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
          },
          status: {
            enum: [
              'running',
              'pending',
            ],
          },
        },
      },
    },
    style: {
      type: 'object',
      properties: {
        color: {
          type: 'object',
          properties: {
            name: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Omit<Description, '$id'> 

