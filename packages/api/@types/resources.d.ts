import type { AccessControl } from '@sonata-api/access-control'
import type { Collection, UnpackFunction } from '../src/types'

declare global {
  type Collections = Record<string, UnpackFunction<Collection>>
  type UserACProfile = {
    readonly roles: string[]
    readonly allowed_functions?: string[]
  }
}
