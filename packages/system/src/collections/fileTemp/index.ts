import { defineCollection } from '@sonata-api/api'

export const fileTemp = defineCollection({
  description: {
    $id: 'fileTemp',
    properties: {
      absolute_path: {
        type: 'string'
      },
      size: {
        type: 'number'
      },
      collection: {
        type: 'string'
      },
      ref: {
        type: 'string'
      },
      filename: {
        type: 'string'
      }
    }
  }
})
