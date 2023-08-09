declare module '@savitri/web' {
  import type { CollectionStore } from '@savitri/web/types'

  type UserCollections = typeof import('../api/src').collections
  type SystemCollections = typeof import('@sonata-api/system/collections')

  type Collections = {
    [K in keyof (SystemCollections & UserCollections)]: Awaited<ReturnType<(SystemCollections & UserCollections)[K]>>
  }

  export function useStore<StoreId extends keyof Collections>(storeId: StoreId): Omit<CollectionStore<Collections[StoreId]>,
    'functions'
    | 'item'
    | 'items'> & {
    functions: 'functions' extends keyof Collections[StoreId]
      ? {
        [P in keyof Collections[StoreId]['functions']]: Collections[StoreId]['functions'][P] extends (...args: infer FnParameters) => infer FnReturn
          ? (arg: FnParameters[0]) => FnReturn
          : never
      }
      : never
    item: Collections[StoreId]['item']
    items: Array<Collections[StoreId]['item']>
  }
}
