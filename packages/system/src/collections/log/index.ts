import { defineCollection, get, getAll, insert } from '@sonata-api/api'
import { description } from './description'

export const log = defineCollection({
  description,
  functions: {
    get,
    getAll,
    insert
  }
})
