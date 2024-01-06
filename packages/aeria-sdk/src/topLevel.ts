import type { RequestConfig } from '@sonata-api/common'
import type { InstanceConfig } from  './types'
import { RequestMethod } from '@sonata-api/types'
import { authenticate, signout, type AuthenticationPayload } from './auth'
import { request } from './http'
import { apiUrl } from './utils'

type UserFunctions = {
  user: TLOFunctions & {
    authenticate: {
      POST: (payload: AuthenticationPayload) => Promise<any>
    }
    signout: {
      POST: () => Promise<void>
    }
  }
}

export type TLOFunctions = {
  [P: string]: Record<RequestMethod, ((payload?: any) => Promise<any>) & TLOFunctions>
}

export type TopLevelObject = UserFunctions & {
  describe: {
    POST: (...args: any) => Promise<any>
  }
}

export const topLevel = (config: InstanceConfig) => {
  const proxify = (target: any, parent?: string): TopLevelObject => new Proxy<TopLevelObject>(target, {
    get: (_, key) => {
      if( typeof key === 'symbol' ) {
        return target[key]
      }

      const endpoint = parent

      if( key === 'POST' ) {
        switch( endpoint ) {
          case 'user/authenticate': return authenticate(config)
          case 'user/signout': return signout(config)
        }
      }

      const fn = async (payload: any) => {
        const method = key as RequestMethod
        const requestConfig: RequestConfig = {
          params: {
            method
          }
        }

        if( method !== 'GET' && method !== 'HEAD' ) {
          if( payload ) {
            requestConfig.params!.headers = {
              'content-type': 'application/json'
            }
          }
        }

        const response = await request(
          config,
          `${apiUrl(config)}/${endpoint}`,
          payload,
          requestConfig
        )

        return response.data
      }

      const path = parent
        ? `${parent}/${key}`
        : key

      return proxify(fn, path)
    }
  })

  return proxify({})
}

