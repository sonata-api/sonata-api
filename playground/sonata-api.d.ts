// this file will be overwritten
import type { AssetType, ResourceErrors, Schema } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import type { Either } from '@sonata-api/common'

declare global {
  type SystemCollections = typeof import('@sonata-api/system/collections')
  type UserCollections = typeof import('./src').collections

  type Collections = {
    [K in keyof (SystemCollections & UserCollections)]: ReturnType<(SystemCollections & UserCollections)[K]>
  }
}
//
