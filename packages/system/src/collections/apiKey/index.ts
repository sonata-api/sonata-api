import { useFunctions } from '@sonata-api/api'
import { description, ApiKey } from './description'
import insert from './insert'

export default () => ({
  item: ApiKey,
  description,
  functions: {
    ...useFunctions<ApiKey>()([
      'getAll'
    ]),
    insert,
  }
})
