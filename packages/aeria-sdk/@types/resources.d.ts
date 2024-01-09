import type { Collection } from '@sonata-api/types'

declare global {
  type Collections = Record<string, Collection>
}
