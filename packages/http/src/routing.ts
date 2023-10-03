import type {
  GenericRequest,
  GenericResponse,
  RequestMethod,
  MatchedRequest,
  RouteOptions

} from './types'

import { pipe, left, isLeft, unwrapEither } from '@sonata-api/common'
import { safeJson } from './payload'

export type RouterOptions = {
  exhaust?: boolean
}

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

  if( !url.startsWith(base) ) {
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

export const registerRoute = <TCallback extends (req: MatchedRequest, res: GenericResponse) => any>(
  req: GenericRequest,
  res: GenericResponse,
  method: RequestMethod | RequestMethod[],
  exp: string,
  cb: TCallback,
  options?: RouteOptions
) => {
  const match = matches(req, method, exp, options)
  if( match ) {
    if( req.headers['content-type'] === 'application/json' ) {
      try {
        req.payload = safeJson(req.body)
      } catch( err ) {
        res.writeHead(500)
        res.end(left({
          httpCode: 500,
          message: 'Invalid JSON'
        }))
        return null
      }
    }

    return cb(match, res)
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

  const routes: ((_: unknown, req: GenericRequest, res: GenericResponse) => ReturnType<typeof registerRoute>)[] = []

  const route = <TCallback extends (req: MatchedRequest, res: GenericResponse) => any|Promise<any>>(
    method: RequestMethod | RequestMethod[],
    exp: string,
    cb: TCallback,
    options?: RouteOptions
  ) => {
    routes.push((_, req, res) => {
      return registerRoute(req, res, method, exp, cb, options)
    })
  }

  const routerPipe = pipe(routes, {
    returnFirst: true
  })

  const router = {
    route,
    routes,
    install: (_req: GenericRequest, _res: GenericResponse) => {
      return {} as ReturnType<typeof routerPipe>
    }
  }

  router.install = async (req: GenericRequest, res: GenericResponse) => {
    const result = await routerPipe(null, req, res)
    if( exhaust && result === undefined ) {
      return left({
        httpCode: 404,
        message: 'Not found'
      })
    }

    return result
  }
  
  return router
}

