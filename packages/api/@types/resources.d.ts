import type { AccessControl } from '@sonata-api/access-control'
import type { Collection, Algorithm } from '../src/types'

declare global {
  type UnpackFunction<T extends () => any> = Required<Awaited<ReturnType<T>>>

  type Collections = Record<string, UnpackFunction<Collection>>
  type Algorithms = Record<string, UnpackFunction<Algorithm>>

  type UserAccessControl = AccessControl<Collections, Algorithms>
  type UserACProfile = {
    readonly roles: string[]
    readonly allowed_functions?: string[]
  }
}
