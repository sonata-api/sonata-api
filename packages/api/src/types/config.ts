import type { ObjectId } from '@sonata-api/types'
import type { Context } from '../context'
import type { FunctionPath } from './resource'

type User = {
  _id: ObjectId
  roles: string[]
}


export type DecodedToken = {
  user: Omit<User, 'roles'> & {
    roles?: string[]
  }
  extra?: Record<string, any>
  allowed_functions?: FunctionPath[]
  key_id?: string
  key_name?: string
}

export type ApiConfig = {
  port?: number
  group?: string

  allowSignup?: boolean
  signupDefaults?: Partial<{
    roles: string[]
    active: boolean
  }>

  logSuccessfulAuthentications?: boolean
  tokenUserProperties?: string[]

  errorHandler?: <TError extends Error>(
    context: Context,
    error: TError
  ) => any|Promise<any>
}
