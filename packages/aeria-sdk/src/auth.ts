import type { InstanceConfig } from  './types'
import { isRight, unwrapEither } from '@sonata-api/common'
import { request } from './http'
import { apiUrl } from './utils'
import { getStorage } from './storage'

export type AuthenticationResult = {
  user: any
  token: {
    type: 'bearer'
    content: string
  }
}

export type AuthenticationPayload = {
  email: string
  password: string
}

export const authMemo = {} as AuthenticationResult

export const authenticate = (config: InstanceConfig) => async (payload: AuthenticationPayload) => {
  const response = await request(config, `${apiUrl(config)}/user/authenticate`, payload)
  const resultEither = response.data
  if( isRight(resultEither) ) {
    const result = unwrapEither(resultEither)
    getStorage(config).set('auth', result)
  }

  return resultEither
}

export const signout = (config: InstanceConfig) => async () => {
  getStorage(config).remove('auth')
}
