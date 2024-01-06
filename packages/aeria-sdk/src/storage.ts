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
          const value = localStorage.getItem(storageKey(key, config))
          return value
            ? JSON.parse(value)
            : null
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
    set: (key: string, value: any) => {
      switch( strategy ) {
        case 'memo':
          storageMemo[key] = value
          break
        case 'localStorage':
          const serialized = JSON.stringify(value)
          return localStorage.setItem(storageKey(key, config), serialized)
      }
    },
  }
}
