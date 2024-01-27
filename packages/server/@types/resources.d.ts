import type { Collection } from '@sonata-api/types'

declare global {
  type Collections = typeof import('@sonata-api/system').collections
}
