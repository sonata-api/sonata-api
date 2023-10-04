import { defineCollection, useFunctions } from '@sonata-api/api'
import { description, ApiKey } from './description'
import insert from './insert'

export const apiKey = defineCollection(() => ({
  item: ApiKey,
  description,
  functions: {
    ...useFunctions<ApiKey>()([
      'getAll'
    ]),
    insert,
  }
}))
