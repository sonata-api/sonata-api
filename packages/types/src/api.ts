import type { ObjectId, Context, Description, SecurityPolicy, AccessControl } from '.'

type User = {
  _id: ObjectId
  roles: string[]
}

export type Collection<TCollection extends Collection = any> = {
  description: Description
  item?: any
  security?: SecurityPolicy
  accessControl?: AccessControl<TCollection>
  functions?: Record<string, (payload: any, context: Context, ...args: any[]) => any>
}

export type AssetType = keyof Collection

export type FunctionPath = `${string}@${string}`
export type Collections = Record<string, Collection>

export type UserACProfile = {
  readonly roles: string[]
  readonly allowed_functions?: string[]
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
