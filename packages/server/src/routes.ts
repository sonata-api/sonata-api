import type { Context } from '@sonata-api/api'
import { pipe } from '@sonata-api/common'
import {
  type GenericRequest,
  type GenericResponse,
  type MatchedRequest,
  route

} from '@sonata-api/http'

import {
  safeHandle,
  regularVerb,
  customVerbs,
  fileDownload

} from './handler'


export const registerRoutes = async (req: GenericRequest, res: GenericResponse, context: Context) => {
  const defaultHandler = (fn: ReturnType<typeof regularVerb>) => {
    return (matchedRequest: MatchedRequest) => safeHandle(fn, context)(matchedRequest, res)
  }

  const resultPipe = pipe([
    () => route(req, res, 'GET', '/api/(\\w+)/id/(\\w+)$', defaultHandler(regularVerb('get'))),
    () => route(req, res, 'GET', '/api/(\\w+)$', defaultHandler(regularVerb('getAll'))),
    () => route(req, res, 'POST', '/api/(\\w+)$', defaultHandler(regularVerb('insert'))),
    () => route(req, res, 'DELETE', '/api/(\\w+)/(\\w+)$', defaultHandler(regularVerb('remove'))),
    () => route(req, res, 'POST', '/api/(\\w+)/upload$', defaultHandler(regularVerb('upload'))),
    () => route(req, res, ['POST', 'GET'], '/api/(\\w+)/(\\w+)$', defaultHandler(customVerbs('collection'))),
    () => route(req, res, ['POST', 'GET'], '/api/_/(\\w+)/(\\w+)$', defaultHandler(customVerbs('algorithm'))),
  ], {
    returnFirst: true
  })

  const result = await resultPipe(undefined)

  if( !result && !res.headersSent ) {
    res.writeHead(404)
    res.end('not found')
  }

  // return [
  //   {
  //     method: 'POST',
  //     path: '/api/{resourceName}/upload',
  //     handler: defaultHandler(regularVerb('upload')),
  //     options: {
  //       payload: {
  //         maxBytes: 2*(100*(1024**2))
  //       }
  //     }
  //   },
  //   {
  //     method: ['POST', 'GET'],
  //     path: '/api/{resourceName}/{functionName}',
  //     handler: defaultHandler(customVerbs('collection'))
  //   },
  //   {
  //     method: ['POST', 'GET'],
  //     path: '/api/_/{resourceName}/{functionName}',
  //     handler: defaultHandler(customVerbs('algorithm'))
  //   },
  //   {
  //     method: 'GET',
  //     path: '/api/file/{hash}/{options*}',
  //     handler: defaultHandler(fileDownload),
  //     options: {
  //       cache: {
  //         expiresIn: 10000,
  //         privacy: 'private'
  //       }
  //     }
  //   },
  //   {
  //     method: 'GET',
  //     path: '/{param}',
  //     handler: {
  //       directory: {
  //         path: `${process.cwd()}/public`,
  //         redirectToSlash: true,
  //         index: true
  //       }
  //     }
  //   },
  //   {
  //     method: 'GET',
  //     path: '/public/{param}',
  //     handler: {
  //       directory: {
  //         path: `${process.cwd()}/public`,
  //         redirectToSlash: true,
  //         index: true
  //       }
  //     }
  //   }
  // ]
}
