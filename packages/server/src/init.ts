import type { Context, GenericRequest, ApiConfig, DecodedToken } from '@sonata-api/types'
import { right, left, isLeft, unwrapEither } from '@sonata-api/common'
import { defineServerOptions, cors, wrapRouteExecution } from '@sonata-api/http'
import { registerServer } from '@sonata-api/node-http'

import { createContext, decodeToken, ObjectId } from '@sonata-api/api'
import { getDatabase } from '@sonata-api/api'
import { DEFAULT_API_CONFIG } from './constants'
import { warmup } from './warmup'
import { registerRoutes } from './routes'

export const getDecodedToken = async (request: GenericRequest) => {
  try {
    const decodedToken: DecodedToken = request.headers.authorization
      ? await decodeToken(request.headers.authorization.split('Bearer ').pop() || '')
      : { user: {} }

      if( decodedToken.user._id ) {
        decodedToken.user._id = new ObjectId(decodedToken.user._id)
      }

    return right(decodedToken)
  } catch( err ) {
    if( process.env.NODE_ENV === 'development' ) {
      console.trace(err)
    }

    return left('AUTHENTICATION_ERROR')
  }
}


export const dryInit = async (
  _apiConfig?: ApiConfig | null,
  cb?: (context: Context) => any
) => {
  const apiConfig: ApiConfig = {}
  Object.assign(apiConfig, DEFAULT_API_CONFIG)
  if( _apiConfig ) {
    Object.assign(apiConfig, _apiConfig)
  }

  const parentContext = await createContext({
    apiConfig
  })

  console.time('warmup')
  await warmup()

  console.log()
  console.timeEnd('warmup')

  const serverOptions = defineServerOptions()
  const apiRouter = registerRoutes()

  const server = registerServer(serverOptions, async (request, response) => {
    if( cors(request, response) === null ) {
      return
    }

    await wrapRouteExecution(response, async () => {
      const tokenEither = await getDecodedToken(request)
      if( isLeft(tokenEither) ) {
        return tokenEither
      }

      const token = unwrapEither(tokenEither)
      const context = await createContext({
        parentContext,
        token
      })

      Object.assign(context, {
        request,
        response
      })

      if( cb ) {
        const result = await cb(context)
        if( result !== undefined ) {
          return result
        }
      }

      return apiRouter.install(context)
    })
  })

  return server
}

export const initWithDatabase = async (...args: Parameters<typeof dryInit>) => {
  await getDatabase()
  return dryInit(...args)
}

export const initThenStart = async (...args: Parameters<typeof dryInit>) => {
  const server = await dryInit(...args)
  server.listen()
}

export const init = async (...args: Parameters<typeof dryInit>) => {
  const server = await initWithDatabase(...args)
  server.listen()
}
