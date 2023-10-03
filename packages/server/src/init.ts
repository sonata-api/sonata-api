import type { GenericRequest, GenericResponse } from '@sonata-api/http'
import { defineServerOptions, cors, makeRouter, wrapRouteExecution } from '@sonata-api/http'
import { registerServer } from '@sonata-api/node-http'

import { createContext, type ApiConfig } from '@sonata-api/api'
import { getDatabase } from '@sonata-api/api'
import { defaultApiConfig } from './constants'
import { warmup } from './warmup'
import { registerRoutes } from './routes'

export const dryInit = async (
  _apiConfig?: ApiConfig,
  cb?: (req: GenericRequest, res: GenericResponse) => any
) => {
  const apiConfig: ApiConfig = {}
  Object.assign(apiConfig, defaultApiConfig)
  Object.assign(apiConfig, _apiConfig)

  const context = await createContext({
    apiConfig
  })

  console.time('warmup')
  await warmup()

  console.log()
  console.timeEnd('warmup')

  const serverOptions = defineServerOptions()
  const apiRouter = registerRoutes(context)

  const server = registerServer(serverOptions, async (req, res) => {
    if( cors(req, res) === null ) {
      return
    }

    await wrapRouteExecution(res, async () => {
      if( cb ) {
        const result = await cb(req, res)
        if( result !== undefined ) {
          return result
        }
      }

      return apiRouter.install(req, res)
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
