import { useFunctions } from '@sonata-api/api'
import { description, ApiKey } from './description'
import insert from './insert'

export const apiKey = () => ({
  item: ApiKey,
  description,
  functions: {
    ...useFunctions<ApiKey>()([
      'getAll'
    ]),
    insert,
  }
})
