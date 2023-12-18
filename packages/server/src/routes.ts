import type { Context } from '@sonata-api/types'
import { makeRouter } from '@sonata-api/http'
import { functions } from '@sonata-api/system'
import {
  safeHandle,
  regularVerb,
  customVerbs,
  fileDownload

} from './handler'

export const registerRoutes = () => {
  const defaultHandler = (fn: ReturnType<typeof regularVerb>) => {
    return (context: Context) => safeHandle(fn, context)()
  }

  const router = makeRouter({
    exhaust: true
  })

  router.route(['POST', 'GET'], '/api/describe', functions.describe)
  router.GET('/api/file/(\\w+)(/(\\w+))*', defaultHandler(fileDownload))
  router.GET('/api/(\\w+)/id/(\\w+)', defaultHandler(regularVerb('get')))
  router.GET('/api/(\\w+)', defaultHandler(regularVerb('getAll')))
  router.POST('/api/(\\w+)', defaultHandler(regularVerb('insert')))
  router.DELETE('/api/(\\w+)/(\\w+)', defaultHandler(regularVerb('remove')))
  router.route(['POST', 'GET'], '/api/(\\w+)/(\\w+)', defaultHandler(customVerbs()))

  return router
}
