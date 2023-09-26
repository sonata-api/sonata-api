import type { Context } from '@sonata-api/api'
import { pipe, left, isLeft, unwrapEither } from '@sonata-api/common'
import {
  type GenericRequest,
  type GenericResponse,
  type MatchedRequest,
  makeRouter

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

  const route = makeRouter(req, res)

  try {
    const resultPipe = pipe([
      () => route('GET', '/api/(\\w+)/id/(\\w+)$', defaultHandler(regularVerb('get'))),
      () => route('GET', '/api/(\\w+)$', defaultHandler(regularVerb('getAll'))),
      () => route('POST', '/api/(\\w+)$', defaultHandler(regularVerb('insert'))),
      () => route('DELETE', '/api/(\\w+)/(\\w+)$', defaultHandler(regularVerb('remove'))),
      () => route('POST', '/api/(\\w+)/upload$', defaultHandler(regularVerb('upload'))),
      () => route(['POST', 'GET'], '/api/(\\w+)/(\\w+)$', defaultHandler(customVerbs('collection'))),
      () => route(['POST', 'GET'], '/api/_/(\\w+)/(\\w+)$', defaultHandler(customVerbs('algorithm'))),
      () => route('GET', '/api/file/(\\w+)/(\\w+)$', defaultHandler(fileDownload)),
      () => left({
        httpCode: 404,
        message: 'Not found'
      })
    ], {
      returnFirst: true
    })

    const result = await resultPipe(undefined)

    if( !res.headersSent && isLeft(result) ) {
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
      const error = left({
        httpCode: 500,
        message: 'Internal server error'
      })

      res.writeHead(500)
      res.end(error)
    }
  }

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
