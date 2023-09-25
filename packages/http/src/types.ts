import type { matches } from './routing'

export type RouteOptions = {
  base?: string
}

export type RequestMethod =
  'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'TRACE'
  | 'SEARCH'

export type GenericRequest = {
  url: string
  method: string
  headers: Record<string, any>
  body?: string
  payload: Record<string, any>
}

export type GenericResponse = {
  headersSent?: boolean
  setHeader: (header: string, value: string) => void
  writeHead: (status: number) => void
  end: (content: any) => void
}

export type MatchedRequest = NonNullable<ReturnType<typeof matches>>
