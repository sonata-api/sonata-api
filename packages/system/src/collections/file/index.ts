import { defineCollection, get } from '@sonata-api/api'
import { description } from './description'
import { insert } from './insert'
import { download } from './download'

export const file = defineCollection({
  description,
  functions: {
    get,
    insert,
    download,
  },
})
