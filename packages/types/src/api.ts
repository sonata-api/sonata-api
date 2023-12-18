import type { ObjectId, Context, Description, SecurityPolicy, AccessControl } from '.'

type User = {
  _id: ObjectId
  roles: string[]
}

export type CollectionStructure<TCollectionStructure extends CollectionStructure = any> = {
  item: any
  description: Description
  security?: SecurityPolicy
  accessControl?: AccessControl<TCollectionStructure>
  functions?: Record<string, (...args: any[]) => any>
  $functions?: Record<string, (...args: any[]) => any>
}

export type Collection<TCollectionStructure extends CollectionStructure = any> =
  CollectionStructure<TCollectionStructure> extends infer RecursiveCollection
    ? () => RecursiveCollection
    : never

export type AssetType = keyof CollectionStructure

export type FunctionPath = `${string}@${string}`
export type Collections = Record<string, ReturnType<Collection>>

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
