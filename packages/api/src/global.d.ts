import type { mongoose } from 'mongoose'
import type { Description } from '../types'
import type { Config, Collection, Algorithm, AccessControl } from './types'
import * as SystemCollections from '@sonata-api/system/collections'
import * as SystemAlgorithms from '@sonata-api/system/algorithms'

declare global {
  type UserCollections = Record<string, Collection>
  type UserAlgorithms = Record<string, Algorithm>

  type UserConfig = Config<
    UserCollections & typeof SystemCollections,
    UserAlgorithms & typeof UserAlgorithms
  >

  type UnpackFunctions<T> = {
    [K in keyof (T)]: Awaited<ReturnType<(T)[K]>>
  }

  type Collections = UnpackFunctions<UserCollections | typeof SystemCollections>
  type Algorithms = UnpackFunctions<UserAlgorithms | typeof SystemAlgorithms>

  type UserAccessControl = AccessControl<any>
  type UserACProfile = {
    readonly roles: string[]
    readonly allowed_functions?: string[]
  }
}
