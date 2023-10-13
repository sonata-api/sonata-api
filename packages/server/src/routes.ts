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

  router.GET('/api/file/(\\w+)(/(\\w+))*$', defaultHandler(fileDownload))
  router.GET('/api/(\\w+)/id/(\\w+)$', defaultHandler(regularVerb('get')))
  router.GET('/api/(\\w+)$', defaultHandler(regularVerb('getAll')))
  router.POST('/api/(\\w+)$', defaultHandler(regularVerb('insert')))
  router.DELETE('/api/(\\w+)/(\\w+)$', defaultHandler(regularVerb('remove')))
  router.POST('/api/(\\w+)/upload$', defaultHandler(regularVerb('upload')))
  router.route(['POST', 'GET'], '/api/(\\w+)/(\\w+)$', defaultHandler(customVerbs('collection')))
  router.route(['POST', 'GET'], '/api/_/(\\w+)/(\\w+)$', defaultHandler(customVerbs('algorithm')))

  return router
}
