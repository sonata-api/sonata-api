import type { InstanceConfig } from './types'

export const apiUrl = (config: InstanceConfig) => {
  if( typeof config.apiUrl === 'string' ) {
    return config.apiUrl
  }

  return process.env.NODE_ENV === 'production'
    ? config.apiUrl.production
    : config.apiUrl.development
}

