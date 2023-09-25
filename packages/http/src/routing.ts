import type {
  GenericRequest,
  GenericResponse,
  RequestMethod,
  MatchedRequest,
  RouteOptions

} from './types'

import { safeJson } from './payload'

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
    if( Array.isArray(method) && !method.includes(req.method as RequestMethod) ) {
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

export const route = <
  TRequest extends GenericRequest,
  TCallback extends (req: MatchedRequest) => any
>(
  req: TRequest,
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
        res.end('invalid json')
        return null
      }
    }

    return cb(match)
  }
}

