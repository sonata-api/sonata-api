import type { Context } from '@sonata-api/api'
import type { GenericRequest, GenericResponse, RequestMethod } from './types'
import { REQUEST_METHODS, DEFAULT_BASE_URI } from './constants'
import { pipe, left, isLeft, unwrapEither, deepMerge } from '@sonata-api/common'
import { safeJson } from './payload'

export type RouterOptions = {
  exhaust?: boolean
  base: string
  middleware?: (context: Context) => any
}

export type AbbreviatedRouteParams = Parameters<typeof registerRoute> extends [infer _Context, infer _Method, ...infer Rest]
  ? Rest
  : never

export type ProxiedRouter<TRouter> = TRouter & Record<RequestMethod, (...args: AbbreviatedRouteParams) => ReturnType<typeof registerRoute>>

export const matches = <TRequest extends GenericRequest>(
  req: TRequest,
  method: RequestMethod | RequestMethod[],
  exp: string | RegExp,
  options: RouterOptions
) => {
  const { url } = req
  const { base } = options

  if( !url.startsWith(`${base}/`) ) {
    return
  }

  if( method !== req.method ) {
    if( !Array.isArray(method) || !method.includes(req.method) ) {
      return
    }
  }

  const regexp = exp instanceof RegExp
    ? exp
    : new RegExp(`${exp}$`)

  const matches = url.split('?')[0].match(regexp)

  if( matches ) {
    const fragments = matches.splice(1)
    return {
      fragments
    }
  }
}

export const registerRoute = async <TCallback extends (context: Context) => any>(
  context: Context,
  method: RequestMethod | RequestMethod[],
  exp: string,
  cb: TCallback,
  options: RouterOptions = { base: DEFAULT_BASE_URI }
) => {
  const match = matches(context.request, method, exp, options)
  if( match ) {
    if( options?.middleware ) {
      const result = await options.middleware(context)
      if( result !== undefined ) {
        return result
      }
    }

    if( context.request.headers['content-type'] === 'application/json' ) {
      try {
        context.request.payload = deepMerge(
          context.request.payload || {},
          safeJson(context.request.body)
        )

      } catch( err ) {
        context.response.writeHead(500)
        context.response.end(left({
          httpCode: 500,
          message: 'Invalid JSON'
        }))
        return null
      }
    }

    Object.assign(context.request, match)

    const result = await cb(context)
    return result === undefined
      ? null
      : result
  }
}

export const wrapRouteExecution = async (res: GenericResponse, cb: () => any|Promise<any>) => {
  try {
    const result = await cb()
    if( result === null ) {
      res.writeHead(204)
      res.end()
      return
    }

    if( !res.headersSent && result && isLeft(result) ) {
      const error: any = unwrapEither(result)
      if( error.httpCode ) {
        res.writeHead(error.httpCode)
      }
    }

    if( !res.writableEnded ) {
      res.end(result)
    }

    return result

  } catch( e ) {
    if( process.env.NODE_ENV !== 'production' ) {
      console.trace(e)
    }

    if( !res.headersSent ) {
      res.writeHead(500)
    }

    if( !res.writableEnded ) {
      const error = left({
        httpCode: 500,
        message: 'Internal server error'
      })

      res.end(error)
    }
  }
}

export const makeRouter = (options: Partial<RouterOptions> = {}) => {
  const { exhaust } = options
  if( !options.base ) {
    options.base = DEFAULT_BASE_URI
  }

  const routes: ((_: unknown, context: Context) => ReturnType<typeof registerRoute>)[] = []

  const route = <TCallback extends (context: Context<any>) => any|Promise<any>>(
    method: RequestMethod | RequestMethod[],
    exp: string,
    cb: TCallback,
    routeOptions?: RouterOptions
  ) => {
    routes.push((_, context) => {
      return registerRoute(context, method, exp, cb, routeOptions || options as Required<RouterOptions>)
    })
  }

  const routerPipe = pipe(routes, {
    returnFirst: true
  })

  const router = {
    route,
    routes,
    install: (_context: Context) => {
      return {} as ReturnType<typeof routerPipe>
    }
  }

  router.install = async (context: Context) => {
    const result = await routerPipe(null, context)
    if( exhaust && result === undefined ) {
      return left({
        httpCode: 404,
        message: 'Not found'
      })
    }

    return result
  }
  
  return new Proxy(router as ProxiedRouter<typeof router>, {
    get: (target, key) => {
      if( REQUEST_METHODS.includes(key as any) ) {
        return (...args: AbbreviatedRouteParams) => target.route(key as RequestMethod, ...args)
      }

      return target[key as keyof typeof target]
    }
  })
}

