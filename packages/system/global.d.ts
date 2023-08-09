import type { Description } from '../types'

declare global {
  var descriptions: Record<string, Description>
  var modules: Record<string, any>
}
