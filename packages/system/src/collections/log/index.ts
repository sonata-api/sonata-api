import { useFunctions } from '@sonata-api/api'
import { description, Log } from './description'

export const log = () => ({
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
