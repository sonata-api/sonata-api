import type { InstanceConfig } from  './types'
import { authenticate, signout, type AuthenticationPayload } from './auth'
import { request } from './http'
import { apiUrl } from './utils'

type UserFunctions = {
  user: TLOFunctions & {
    authenticate: (payload: AuthenticationPayload) => Promise<any>
    signout: () => Promise<void>
  }
}

export type TLOFunctions = {
  [P in string]: ((payload?: any) => Promise<any>) & TLOFunctions
}

export type TopLevelObject = UserFunctions & {
  describe: (...args: any) => Promise<any>
  $currentUser: any
}

export const topLevel = (config: InstanceConfig) => {
  const proxify = (target: any, parent?: string): TopLevelObject => new Proxy<TopLevelObject>(target, {
    get: (_, key) => {
      if( typeof key === 'symbol' ) {
        return target[key]
      }

      const endpoint = parent
        ? `${parent}/${key}`
        : `${key}`

      switch( endpoint ) {
        case 'user/authenticate': return authenticate(config)
        case 'user/signout': return signout(config)
      }

      const fn = async (payload: any) => {
        const response = payload
          ? await request(config, `${apiUrl(config)}/${endpoint}`, payload)
          : await request(config, `${apiUrl(config)}/${endpoint}`)

        return response.data
      }

      return proxify(fn, endpoint)
    }
  })

  return proxify({})
}

