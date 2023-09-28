import { useFunctions } from '@sonata-api/api'
import { description, File } from './description'
import insert from './insert'
import download from './download'
import remove from './remove'

export const file = () => ({
  item: {} as File,
  description,
  functions: {
    ...useFunctions<typeof File>()([
      'get'
    ]),
    insert,
    download,
    remove
  }
})
