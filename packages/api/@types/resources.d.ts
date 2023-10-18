import type { Collection } from '../src/types'

declare global {
  type Collections = Record<string, ReturnType<Collection>>
  type UserACProfile = {
    readonly roles: string[]
    readonly allowed_functions?: string[]
  }
}
