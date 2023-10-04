import { defineCollection } from '@sonata-api/api'
import { description, ResourceUsage } from './description'

export const resourceUsage = defineCollection(() => ({
  item: ResourceUsage,
  description
}))
