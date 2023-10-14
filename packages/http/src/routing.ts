import type { Context } from '@sonata-api/api'
import type { GenericRequest, GenericResponse, RequestMethod, RouteOptions } from './types'
import { REQUEST_METHODS } from './constants'
import { pipe, left, isLeft, unwrapEither } from '@sonata-api/common'
import { safeJson } from './payload'

export type RouterOptions = {
  exhaust?: boolean
}

export type AbbreviatedRouteParams = Parameters<typeof registerRoute> extends [infer _Context, infer _Method, ...infer Rest]
  ? Rest
  : never

export type ProxiedRouter<TRouter> = TRouter & Record<RequestMethod, (...args: AbbreviatedRouteParams) => ReturnType<typeof registerRoute>>

export const matches = <TRequest extends GenericRequest>(
  req: TRequest,
  method: RequestMethod | RequestMethod[],
  exp: string,
  options?: RouteOptions
) => {
  const { url } = req
  const {
    base = '/api'

  } = options || {}

  if( !url.startsWith(`${base}/`) ) {
    return
  }

  if( method !== req.method ) {
    if( !Array.isArray(method) || !method.includes(req.method) ) {
      return
    }
  }

  const regexp = new RegExp(exp)
  const matches = url.match(regexp)

  if( matches ) {
    const fragments = matches.splice(1)
    return {
      req,
      fragments
    }
  }
}

export const registerRoute = <TCallback extends (context: Context) => any>(
  context: Context,
  method: RequestMethod | RequestMethod[],
  exp: string,
  cb: TCallback,
  options?: RouteOptions
) => {
  const match = matches(context.request, method, exp, options)
  if( match ) {
    if( context.request.headers['content-type'] === 'application/json' ) {
      try {
        context.request.payload = safeJson(context.request.body)

      } catch( err ) {
        context.response.writeHead(500)
        context.response.end(left({
          httpCode: 500,
          message: 'Invalid JSON'
        }))
        return null
      }
    }

    return cb(context)
  }
}

export const wrapRouteExecution = async (res: GenericResponse, cb: () => any|Promise<any>) => {
  try {
    const result = await cb()
    if( result === undefined ) {
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
    if( !res.headersSent ) {
      if( process.env.NODE_ENV !== 'production' ) {
        console.trace(e)
      }

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

export const makeRouter = (options?: RouterOptions) => {
  const {
    exhaust
  } = options || {}

  const routes: ((_: unknown, context: Context) => ReturnType<typeof registerRoute>)[] = []

  const route = <TCallback extends (context: Context) => any|Promise<any>>(
    method: RequestMethod | RequestMethod[],
    exp: string,
    cb: TCallback,
    options?: RouteOptions
  ) => {
    routes.push((_, context) => {
      return registerRoute(context, method, exp, cb, options)
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

