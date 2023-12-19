import { defineCollection, useFunctions } from '@sonata-api/api'
import { description, Log } from './description'

export const log = defineCollection({
  item: Log,
  description,
  functions: {
    ...useFunctions<typeof Log>()([
      'get',
      'getAll',
      'insert'
    ])
  }
})
