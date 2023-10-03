import type { Context } from '@sonata-api/api'
import type { GenericResponse, MatchedRequest } from '@sonata-api/http'
import { makeRouter } from '@sonata-api/http'
import {
  safeHandle,
  regularVerb,
  customVerbs,
  fileDownload

} from './handler'

export const registerRoutes = (context: Context) => {
  const defaultHandler = (fn: ReturnType<typeof regularVerb>) => {
    return (matchedRequest: MatchedRequest, res: GenericResponse) => safeHandle(fn, context)(matchedRequest, res)
  }

  const router = makeRouter({
    exhaust: true
  })

  router.route('GET', '/api/file/(\\w+)(/(\\w+))*$', defaultHandler(fileDownload))
  router.route('GET', '/api/(\\w+)/id/(\\w+)$', defaultHandler(regularVerb('get')))
  router.route('GET', '/api/(\\w+)$', defaultHandler(regularVerb('getAll')))
  router.route('POST', '/api/(\\w+)$', defaultHandler(regularVerb('insert')))
  router.route('DELETE', '/api/(\\w+)/(\\w+)$', defaultHandler(regularVerb('remove')))
  router.route('POST', '/api/(\\w+)/upload$', defaultHandler(regularVerb('upload')))
  router.route(['POST', 'GET'], '/api/(\\w+)/(\\w+)$', defaultHandler(customVerbs('collection')))
  router.route(['POST', 'GET'], '/api/_/(\\w+)/(\\w+)$', defaultHandler(customVerbs('algorithm')))

  return router
}
