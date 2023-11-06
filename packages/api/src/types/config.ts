import type { Context } from '../context'
import type { FunctionPath } from './resource'
import type { ObjectId } from './database'

type User = {
  _id: ObjectId
  roles: Array<string>
}


export type DecodedToken = {
  user: Omit<User, 'roles'> & {
    roles?: Array<string>
  }
  extra?: Record<string, any>
  allowed_functions?: Array<FunctionPath>
  key_id?: string
  key_name?: string
}

export type ApiConfig = {
  port?: number
  group?: string

  allowSignup?: boolean
  signupDefaults?: Partial<{
    roles: Array<string>
    active: boolean
  }>

  logSuccessfulAuthentications?: boolean
  tokenUserProperties?: Array<string>

  errorHandler?: <TError extends Error>(
    context: Context,
    error: TError
  ) => any|Promise<any>
}
