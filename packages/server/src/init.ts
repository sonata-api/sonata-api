import type { GenericRequest } from '@sonata-api/http'
import type { ApiConfig, DecodedToken, Context } from '@sonata-api/api'
import { right, left, isLeft, unwrapEither } from '@sonata-api/common'
import { defineServerOptions, cors, wrapRouteExecution } from '@sonata-api/http'
import { registerServer } from '@sonata-api/node-http'

import { createContext, decodeToken, ObjectId } from '@sonata-api/api'
import { getDatabase } from '@sonata-api/api'
import { defaultApiConfig } from './constants'
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
  _apiConfig?: ApiConfig,
  cb?: (context: Context) => any
) => {
  const apiConfig: ApiConfig = {}
  Object.assign(apiConfig, defaultApiConfig)
  Object.assign(apiConfig, _apiConfig)

  const parentContext = await createContext({
    apiConfig
  })

  console.time('warmup')
  await warmup()

  console.log()
  console.timeEnd('warmup')

  const serverOptions = defineServerOptions()
  const apiRouter = registerRoutes()

  const server = registerServer(serverOptions, async (req, res) => {
    if( cors(req, res) === null ) {
      return
    }

    await wrapRouteExecution(res, async () => {
      const tokenEither = await getDecodedToken(req)
      if( isLeft(tokenEither) ) {
        return tokenEither
      }

      const token = unwrapEither(tokenEither)
      const context = await createContext({
        parentContext,
        token
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

// #region initWithDatabase
export const initWithDatabase = async (...args: Parameters<typeof dryInit>) => {
  await getDatabase()
  return dryInit(...args)
}
// #endregion initWithDatabase

// #region initThenStart
export const initThenStart = async (...args: Parameters<typeof dryInit>) => {
  const server = await dryInit(...args)
  server.listen()
}
// #endregion initThenStart

// #region initWithDatabaseThenStart
export const init = async (...args: Parameters<typeof dryInit>) => {
  const server = await initWithDatabase(...args)
  server.listen()
}
// #endregion initWithDatabaseThenStart
