import { defineCollection, useFunctions } from '@sonata-api/api'
import { description, ApiKey } from './description'
import insert from './insert'

export const apiKey = defineCollection({
  description,
  functions: {
    ...useFunctions<ApiKey>()([
      'getAll'
    ]),
    insert,
  }
})
