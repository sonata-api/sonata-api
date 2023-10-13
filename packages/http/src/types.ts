import type { matches } from './routing'
import type { REQUEST_METHODS } from './constants'

export type RouteOptions = {
  base?: string
}

export type RequestMethod = (typeof REQUEST_METHODS)[number]

export type GenericRequest = {
  url: string
  method: RequestMethod
  headers: Record<string, any>
  body?: string
  query: Record<string, any>
  payload: Record<string, any>
}

export type GenericResponse = {
  headersSent?: boolean
  writableEnded?: boolean
  setHeader: (header: string, value: string) => void
  writeHead: (status: number, headers?: Record<string, any>) => void
  end: (content?: any) => void
}

export type MatchedRequest = NonNullable<ReturnType<typeof matches>>
