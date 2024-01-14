import type { InstanceConfig } from './types'
import { request as originalRequest, defaultRequestTransformer, type RequestConfig } from '@sonata-api/common'
import { getStorage } from './storage'

export const request = <Return = any>(config: InstanceConfig, url: string, payload?: any, _requestConfig?: RequestConfig) => {
  const requestConfig = Object.assign({}, _requestConfig)
  requestConfig.requestTransformer ??= async (url, payload, _params) => {
    const params = Object.assign({}, _params)
    const auth = getStorage(config).get('auth')

    if( auth?.token ) {
      params.headers ??= {}
      switch( auth.token.type ) {
        case 'bearer': {
          params.headers.authorization = `Bearer ${auth.token.content}`
          break
        }
      }
    }

    return defaultRequestTransformer(url, payload, params)
  }

  return originalRequest(url, payload, requestConfig) as Promise<Return>
}
