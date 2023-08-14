import Hapi from '@hapi/hapi'
import Inert from '@hapi/inert'

import { createContext, type ApiConfig } from '@sonata-api/api'
import { connectDatabase } from '@sonata-api/api'
import { defaultApiConfig } from './constants'
import { warmup } from './warmup'
import getRoutes from './routes'

export const dryInit = async (_apiConfig?: ApiConfig) => {
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

  const server = Hapi.server({
    port: apiConfig.port,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
        headers: [
          'Accept', 
          'Accept-Version',
          'Authorization', 
          'Content-Length', 
          'Content-MD5', 
          'Content-Type', 
          'Date', 
          'X-Api-Version'
        ]
      }
    }
  })

  await server.register(Inert)

  const routes = getRoutes(context)
  for( const route of routes ) {
    server.route(route)
  }

  return server
}

// #region initWithDatabase
export const initWithDatabase = async (...args: Parameters<typeof dryInit>) => {
  await connectDatabase()
  return dryInit(...args)
}
// #endregion initWithDatabase

// #region initThenStart
export const initThenStart = async (...args: Parameters<typeof dryInit>) => {
  const server = await dryInit(...args)
  server.start()
  return server
}
// #endregion initThenStart

// #region initWithDatabaseThenStart
export const init = async (...args: Parameters<typeof dryInit>) => {
  const server = await initWithDatabase(...args)
  server.start()
  return server
}
// #endregion initWithDatabaseThenStart
