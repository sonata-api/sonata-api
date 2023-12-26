import type { InferSchema } from './schema'

export const REQUEST_METHODS = <const>[
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'PATCH',
  'TRACE',
  'SEARCH',
]

export type RequestMethod = (typeof REQUEST_METHODS)[number]

export type GenericRequest = {
  url: string
  method: RequestMethod
  headers: Record<string, any>
  body?: string
  query: Record<string, any>
  payload: Record<string, any>
  fragments: string[]
}

export type GenericResponse = {
  headersSent?: boolean
  writableEnded?: boolean
  setHeader: (header: string, value: string) => void
  writeHead: (status: number, headers?: Record<string, any>) => void
  end: (content?: any) => void
}

export type EndpointFunction<
  TRouteResponse,
  TRoutePayload
> = TRoutePayload extends undefined
  ? () => Promise<TRouteResponse>
  : (payload: TRoutePayload) => Promise<TRouteResponse>

export type MakeEndpoint<
  TRoute extends string,
  TRouteResponse = any,
  TRoutePayload = undefined,
> = TRoute extends `/${infer RouteTail}`
  ? MakeEndpoint<RouteTail, TRouteResponse, TRoutePayload>
    : TRoute extends `${infer Route}/${infer RouteTail}`
      ? Record<Route, MakeEndpoint<RouteTail, TRouteResponse, TRoutePayload>>
      : TRoute extends `(${string}`
        ? Record<string, EndpointFunction<TRouteResponse, TRoutePayload>>
        : Record<TRoute, EndpointFunction<TRouteResponse, TRoutePayload>>

type MapSchemaUnion<TSchema> = TSchema extends (infer SchemaOption)[]
  ? SchemaOption extends any
    ? InferSchema<SchemaOption>
    : never
  : InferSchema<TSchema>

export type InferResponse<TResponse> = TResponse extends null
  ? any
  : MapSchemaUnion<TResponse> extends infer InferredTResponse
    ? InferredTResponse | Promise<InferredTResponse>
    : never
