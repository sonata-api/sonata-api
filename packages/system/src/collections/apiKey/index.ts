import { defineCollection, getAll } from '@sonata-api/api'
import { description } from './description'
import insert from './insert'

export const apiKey = defineCollection({
  description,
  functions: {
    getAll,
    insert,
  }
})
