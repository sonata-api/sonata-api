import { defineServerOptions } from '@sonata-api/http'
import { registerServer } from '@sonata-api/node-http'

import { createContext, type ApiConfig } from '@sonata-api/api'
import { connectDatabase } from '@sonata-api/api'
import { defaultApiConfig } from './constants'
import { warmup } from './warmup'
import { registerRoutes } from './routes'

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

  const serverOptions = defineServerOptions()

  const server = registerServer(serverOptions, (req, res) => {
    registerRoutes(req, res, context)
  })

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
  server.listen()
}
// #endregion initThenStart

// #region initWithDatabaseThenStart
export const init = async (...args: Parameters<typeof dryInit>) => {
  const server = await initWithDatabase(...args)
  server.listen()
}
// #endregion initWithDatabaseThenStart
