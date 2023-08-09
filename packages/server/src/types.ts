import type { Request } from '@hapi/hapi'

export type HandlerRequest = Request & {
  payload: any
}
