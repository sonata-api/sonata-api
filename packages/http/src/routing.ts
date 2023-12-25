import type { Context, GenericRequest, GenericResponse, RequestMethod, InferSchema, InferResponse } from '@sonata-api/types'
import { REQUEST_METHODS } from '@sonata-api/types'
import { DEFAULT_BASE_URI } from './constants'
import { pipe, left, isLeft, unwrapEither, deepMerge } from '@sonata-api/common'
import { validate } from '@sonata-api/validation'
import { safeJson } from './payload'
import { RouteContract } from './contract'

export type RouteUri = `/${string}`

export type RouterOptions = {
  exhaust?: boolean
  base?: RouteUri
}

export type RouteOptions = {
  base?: RouteUri
  middleware?: (context: Context) => any
  contract?: RouteContract
}

type TypedContext<TContract extends RouteContract> = Omit<Context, 'request'> & {
  request: Omit<Context['request'], 'payload'> & {
    payload: TContract extends [infer Payload, any]
      ? Payload extends null
      ? never
      : InferSchema<Payload>
        : never
  }
}

export type ProxiedRouter<TRouter> = TRouter & Record<
  RequestMethod,
  <
    TCallback extends (context: TypedContext<TContract>) => InferResponse<TContract[1]>,
    const TContract extends RouteContract
  >(
    exp: RouteUri,
    cb: TCallback,
    routeOptions?: RouteOptions & {
      contract?: TContract
    }
  ) => ReturnType<typeof registerRoute>
>

export const matches = <TRequest extends GenericRequest>(
  req: TRequest,
  method: RequestMethod | RequestMethod[] | null,
  exp: string | RegExp,
  options: RouteOptions
) => {
  const { url } = req
  const { base = DEFAULT_BASE_URI } = options

  if( method && method !== req.method ) {
    if( !Array.isArray(method) || !method.includes(req.method) ) {
      return
    }
  }

  const regexp = exp instanceof RegExp
    ? exp
    : new RegExp(`^${base}${exp}$`)

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
  exp: RouteUri,
  cb: TCallback,
  options: RouteOptions = {}
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
          safeJson(context.request.body),
          context.request.payload || {},
          { arrays: false }
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

    if( options.contract?.[0] ) {
      const validationEither = validate(context.request.payload, options.contract[0])
      if( isLeft(validationEither) ) {
        return validationEither
      }
    }

    const result = await cb(context)
    return result === undefined
      ? null
      : result
  }
}

export const wrapRouteExecution = async (res: GenericResponse, cb: () => any | Promise<any>) => {
  try {
    const result = await cb()
    if( result === null ) {
      if( !res.headersSent ) {
        res.writeHead(204)
        res.end()
      }
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
  options.base ??= DEFAULT_BASE_URI

  const routes: ((_: unknown, context: Context, groupOptions?: RouteOptions) => ReturnType<typeof registerRoute>)[] = []
  const routesMeta = {} as Record<RouteUri, RouteContract | null>

  const route = <
    TCallback extends (context: TypedContext<TContract>) => InferResponse<TContract[1]>,
    const TContract extends RouteContract
  >(
    method: RequestMethod | RequestMethod[],
    exp: RouteUri,
    cb: TCallback,
    routeOptions?: RouteOptions & {
      contract?: TContract
    }
  ) => {
    routesMeta[exp] = routeOptions?.contract || null
    routes.push((_, context, groupOptions) => {
      return registerRoute(
        context,
        method,
        exp,
        cb as any,
        groupOptions
          ? Object.assign(Object.assign({}, groupOptions), routeOptions || options)
          : routeOptions || options
      )
    })
  }

  const group = <
    TRouter extends {
      install: (context: Context, options?: RouteOptions) => any
      routesMeta: typeof routesMeta
    }
  >(exp: RouteUri, router: TRouter, routeOptions?: RouteOptions) => {
    const newOptions = Object.assign({}, options)

    for( const route in router.routesMeta ) {
      routesMeta[`${exp}${route}`] = router.routesMeta[route as keyof typeof router.routesMeta]
    }

    routes.push(async (_, context, groupOptions) => {
      newOptions.base = groupOptions
        ? `${groupOptions.base!}${exp}`
        : `${options.base!}${exp}`

      const match = matches(context.request, null, new RegExp(`^${newOptions.base}/`), newOptions)
      if( match ) {
        if( routeOptions?.middleware ) {
          const result = await routeOptions.middleware(context)
          if( result ) {
            return result
          }
        }

        return router.install(context, newOptions)
      }
    })
  }

  const routerPipe = pipe(routes, {
    returnFirst: true
  })

  const router = {
    route,
    routes,
    routesMeta,
    group,
    install: (_context: Context, _options?: RouteOptions) => {
      return {} as ReturnType<typeof routerPipe>
    }
  }

  router.install = async (context: Context, options?: RouteOptions) => {
    const result = await routerPipe(undefined, context, options)
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
        return (
          ...args: Parameters<typeof target.route> extends [any, ...infer Params]
            ? Params
            : never
        ) => target.route(key as RequestMethod, ...args)
      }

      return target[key as keyof typeof target]
    }
  })
}

