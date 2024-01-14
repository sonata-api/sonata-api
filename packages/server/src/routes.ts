import type { Context } from '@sonata-api/types'
import { createRouter } from '@sonata-api/http'
import { systemFunctions } from '@sonata-api/system'
import {
  safeHandle,
  regularVerb,
  customVerbs,
  fileDownload,
} from './handler'

export const registerRoutes = () => {
  const defaultHandler = (fn: ReturnType<typeof regularVerb>) => {
    return (context: Context) => safeHandle(fn, context)()
  }

  const router = createRouter({
    exhaust: true,
  })

  router.route([
    'POST',
    'GET',
  ], '/describe', systemFunctions.describe)
  router.GET('/file/(\\w+)(/(\\w+))*', defaultHandler(fileDownload))
  router.GET('/(\\w+)/id/(\\w+)', defaultHandler(regularVerb('get')))
  router.GET('/(\\w+)', defaultHandler(regularVerb('getAll')))
  router.POST('/(\\w+)', defaultHandler(regularVerb('insert')))
  router.DELETE('/(\\w+)/(\\w+)', defaultHandler(regularVerb('remove')))
  router.route([
    'POST',
    'GET',
  ], '/(\\w+)/(\\w+)', defaultHandler(customVerbs()))

  return router
}
