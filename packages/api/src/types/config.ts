import type { AccessControl } from '@sonata-api/access-control'
import type { MatchedRequest, GenericResponse } from '@sonata-api/http'
import type { FunctionPath } from './resource'
import type { ObjectId } from './database'

type User = {
  _id: ObjectId
  roles: Array<string>
}


export type DecodedToken<TAccessControl extends AccessControl<any, any>=any> = {
  user: Omit<User, 'roles'> & {
    roles: Array<NonNullable<TAccessControl['availableRoles']>>
  }
  extra?: Record<string, any>
  allowed_functions?: Array<FunctionPath>
  key_id?: string
  key_name?: string
}

// #region ApiConfig
export type ApiConfig = {
  port?: number
  group?: string

  allowSignup?: boolean
  signupDefaults?: {
    roles: Array<string>
    active: boolean
  }

  logSuccessfulAuthentications?: boolean
  tokenUserProperties?: Array<string>

  errorHandler?: <TError extends Error>(
    req: MatchedRequest,
    res: GenericResponse,
    error?: TError
  ) => any|Promise<any>
}
// #endregion ApiConfig
