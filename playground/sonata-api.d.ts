// this file will be overwritten
import type {} from '@sonata-api/types'

declare global {
  type Collections = typeof import('./src').default extends infer Entrypoint
    ? 'options' extends keyof Entrypoint
      ? 'collections' extends keyof Entrypoint['options']
        ? Entrypoint['options']['collections']
        : never
      : never
    : never
}
//
