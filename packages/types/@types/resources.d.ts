import type { Collection, UnpackFunction } from '../src/types'

declare global {
  type Collections = Record<string, UnpackFunction<Collection>>
}
