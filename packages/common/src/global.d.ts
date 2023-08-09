import type { Description } from '../types'

declare global {
  var descriptions: Record<string, Description>
  var modules: Record<string, any>
  var userStorage: typeof localStorage | typeof sessionStorage
}
