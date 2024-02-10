import type { Context } from './context'

export type ApiConfig = {
  secret?: string
  apiUrl?: string
  port?: number

  mongodbUrl?: string
  noDatabase?: boolean
  paginationLimit?: number

  defaultUser?: {
    username: string
    password: string
  }

  storage?: {
    fs?: string
    tempFs?: string
  }

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
  )=> any|Promise<any>
}

