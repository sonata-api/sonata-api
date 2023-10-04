import { defineCollection, useFunctions } from '@sonata-api/api'
import { description, File } from './description'
import insert from './insert'
import download from './download'
import remove from './remove'

export const file = defineCollection(() => ({
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
}))
