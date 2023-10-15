import type { Description } from '@sonata-api/types'
import type { GenericRequest, GenericResponse } from '@sonata-api/http'
import type { Collection } from 'mongodb'
import type { Schema } from './collection'
import type {
  FunctionPath,
  DecodedToken,
  ApiConfig,
  CollectionStructure,

} from './types'

import { validate } from '@sonata-api/validation'
import { getDatabaseCollection } from './database'
import { preloadDescription } from './collection/preload'
import { unsafe } from '@sonata-api/common'

type CollectionModel<TDescription extends Description> =
  Collection<Omit<Schema<TDescription>, '_id'>>

type Models = {
  [K in keyof Collections]: CollectionModel<Collections[K]['description']>
}

// #region ContextOptions
export type ContextOptions<TContext> = {
  apiConfig?: ApiConfig
  parentContext?: TContext
  collectionName?: string
  token?: DecodedToken
}
// #endregion ContextOptions

// #region Context
export type Context<
  TDescription extends Description=any,
  TCollections extends Collections=any
> = Omit<Awaited<ReturnType<typeof internalCreateContext>>,
  'collectionName'
  | 'collection'
  | 'model'
> & {
  description: TDescription
  model: CollectionModel<TDescription>
  collection: TDescription['$id'] extends keyof Collections
    ? TCollections[TDescription['$id']]
    : CollectionStructure
  functionPath: FunctionPath
  token: DecodedToken

  collectionName?: keyof TCollections & string
  request: GenericRequest
  response: GenericResponse

  apiConfig: ApiConfig
}
// #endregion Context

export const internalCreateContext = async (options?: Pick<ContextOptions<any>,
  'collectionName'
  | 'apiConfig'
  | 'token'
>) => {
  const {
    collectionName,
    apiConfig,
    token = {} as DecodedToken

  } = options || {}

  const { getCollections, getCollectionAsset } = await import('./assets')
  const collections = await getCollections()

  const context = {
    collectionName,
    description: {},
    model: collectionName
      ? getDatabaseCollection(collectionName)
      : {},
    collection: collectionName && await collections[collectionName](),
    collections: new Proxy<Collections>({}, {
      get: <TCollectionName extends keyof typeof collections>(_: unknown, collectionName: TCollectionName) => {
        return collections[collectionName]?.()
      }
    }),
    models: new Proxy<Models>({} as Models, {
      get: (_, key: keyof Collections) => {
        return getDatabaseCollection(key)
      }
    }),

    validate,
    log: async (message: string, details?: any) => {
      return getDatabaseCollection('log').insertOne({
        message,
        details,
        context: collectionName,
        owner: token?.user?._id
          // @ts-ignore
          || options?.parentContext?.token.user._id,
        created_at: new Date
      })
    },
  }

  if( collectionName ) {
    const description = unsafe(await getCollectionAsset(collectionName as any, 'description'))
    context.description = description.alias
      ? await preloadDescription(description)
      : description
  }

  if( token.user ) {
    Object.assign(context, { token })
  }

  if( apiConfig ) {
    Object.assign(context, { apiConfig })
  }

  return context
}

export const createContext = async <TContextOptions>(
  _options?: TContextOptions extends ContextOptions<infer ParentContext>
    ? TContextOptions & {
      parentContext?: any
    }
    : never
) => {
  const options = _options as ContextOptions<Context>
  const context = Object.assign({}, options?.parentContext || {}) as Context

  Object.assign(context, await internalCreateContext(options))

  if( options?.parentContext ) {
    Object.assign(context, {
      apiConfig: options.parentContext.apiConfig || {}
    })
  }

  return context
}
