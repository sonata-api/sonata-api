import type { InstanceConfig } from './types'

export const storageMemo: Record<string, string> = {}

export const storageKey = (key: string, config: InstanceConfig) => {
  const namespace = config.storage?.namespace || 'aeriaSdk'
  return `${namespace}:${key}`
}

export const getStorage = (config: InstanceConfig) => {
  const strategy = !config.storage?.strategy
    ? 'memo'
    : config.storage.strategy === 'localStorage' && !('localStorage' in globalThis)
      ? 'memo'
      : config.storage.strategy

  return {
    get: (key: string) => {
      switch( strategy ) {
        case 'memo':
          return storageMemo[key]
        case 'localStorage':
          return localStorage.getItem(storageKey(key, config))
      }
    },
    remove: (key: string) => {
      switch( strategy ) {
        case 'memo':
          delete storageMemo[key]
          break
        case 'localStorage':
          localStorage.removeItem(storageKey(key, config))
          break
      }
    },
    set: (key: string, value: string) => {
      switch( strategy ) {
        case 'memo':
          storageMemo[key] = value
          break
        case 'localStorage':
          return localStorage.setItem(storageKey(key, config), value)
      }
    },
  }
}
