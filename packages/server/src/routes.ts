import type { Context } from '@sonata-api/api'
import { ServerRoute } from '@hapi/hapi'
import {
  safeHandle,
  regularVerb,
  customVerbs,
  fileDownload

} from './handler'

export default (context: Context<any, any, any>): Array<ServerRoute> => {
  const defaultHandler = (fn: ReturnType<typeof regularVerb>) => {
    return safeHandle(fn, context)
  }

  return [
    {
      method: 'GET',
      path: '/api/{resourceName}/id/{id}',
      handler: defaultHandler(regularVerb('get'))
    },
    {
      method: 'GET',
      path: '/api/{resourceName}',
      handler: defaultHandler(regularVerb('getAll'))
    },
    {
      method: 'POST',
      path: '/api/{resourceName}',
      handler: defaultHandler(regularVerb('insert'))
    },
    {
      method: 'DELETE',
      path: '/api/{resourceName}/{id}',
      handler: defaultHandler(regularVerb('remove'))
    },
    {
      method: 'POST',
      path: '/api/{resourceName}/upload',
      handler: defaultHandler(regularVerb('upload')),
      options: {
        payload: {
          maxBytes: 2*(100*(1024**2))
        }
      }
    },
    {
      method: ['POST', 'GET'],
      path: '/api/{resourceName}/{functionName}',
      handler: defaultHandler(customVerbs('collection'))
    },
    {
      method: ['POST', 'GET'],
      path: '/api/_/{resourceName}/{functionName}',
      handler: defaultHandler(customVerbs('algorithm'))
    },
    {
      method: 'GET',
      path: '/api/file/{hash}/{options*}',
      handler: defaultHandler(fileDownload),
      options: {
        cache: {
          expiresIn: 10000,
          privacy: 'private'
        }
      }
    },
    {
      method: 'GET',
      path: '/{param}',
      handler: {
        directory: {
          path: `${process.cwd()}/public`,
          redirectToSlash: true,
          index: true
        }
      }
    },
    {
      method: 'GET',
      path: '/public/{param}',
      handler: {
        directory: {
          path: `${process.cwd()}/public`,
          redirectToSlash: true,
          index: true
        }
      }
    }
  ]
}
