import type { Description } from '@sonata-api/types'
import type { AccessControl } from '@sonata-api/access-control'
import type { Schema } from './collection'
import type { FunctionPath, DecodedToken, ResourceType, ApiConfig, CollectionStructure } from './types'
import mongoose, { type Model } from 'mongoose'
import { validateFromDescription } from './collection/validate'
import { limitRate, type RateLimitingParams } from './rateLimiting'
import { unsafe } from '@sonata-api/common'

type CollectionModel<TDescription extends Description> =
  Model<Schema<TDescription>>

type Models = {
  [K in keyof Collections]: CollectionModel<Collections[K]['description']>
}

// #region ContextOptions
export type ContextOptions<
  TCollections extends Collections,
  TAlgorithms extends Algorithms
> = {
  apiConfig?: ApiConfig
  parentContext?: Context<any, TCollections, TAlgorithms>,
  resourceType?: ResourceType
  resourceName?: keyof TCollections | keyof TAlgorithms
  token?: DecodedToken
}
// #endregion ContextOptions

// #region Context
export type Context<
  TDescription extends Description=any,
  TCollections extends Collections=any,
  TAlgorithms extends Algorithms=any,
  TAccessControl extends AccessControl<TCollections, TAlgorithms, TAccessControl>=any
> = Omit<Awaited<ReturnType<typeof internalCreateContext>>,
  'resourceName'
  | 'collection'
  | 'collections'
  | 'accessControl'
> & {
  description: TDescription
  model:  CollectionModel<TDescription>
  collection: TDescription['$id'] extends keyof Collections
    ? TCollections[TDescription['$id']]
    : CollectionStructure
  collections: TCollections
  functionPath: FunctionPath
  token: DecodedToken<TAccessControl>

  resourceName?: keyof TCollections | keyof TAlgorithms
  request: any
  h: any

  apiConfig: ApiConfig
  accessControl: TAccessControl
}
// #endregion Context

export const internalCreateContext = async <
  TCollections extends Collections,
  TAlgorithms extends Algorithms
>(options?: Pick<ContextOptions<TCollections, TAlgorithms>,
  'resourceName'
  | 'resourceType'
  | 'apiConfig'
  | 'token'
>) => {
  const {
    resourceName,
    resourceType = 'collection',
    apiConfig,
    token

  } = options||{}

  const { getResources, getResourceAsset, getAccessControl } = await import('./assets')
  const { collections, algorithms } = await getResources()
  const accessControl = await getAccessControl()

  const context = {
    resourceName,
    accessControl,
    description: (resourceName && resourceType === 'collection') && unsafe(await getResourceAsset(resourceName, 'description')),
    model: (resourceName && resourceType === 'collection') && unsafe(await getResourceAsset(resourceName, 'model'), resourceName),
    collection: (resourceName && resourceType === 'collection') && await collections[resourceName](),
    algorithms: new Proxy<Algorithms>({}, {
      get: <TResourceName extends keyof typeof algorithms>(_: unknown, resourceName: TResourceName) => {
        return algorithms[resourceName]?.()
      }
    }),
    collections: new Proxy<Collections>({}, {
      get: <TResourceName extends keyof typeof collections>(_: unknown, resourceName: TResourceName) => {
        return collections[resourceName]?.()
      }
    }),
    models: new Proxy<Models>({} as Models, {
      get: (_, key: keyof Collections) => {
        return mongoose.models[String(key)]
      }
    }),

    validate: validateFromDescription,
    log: async (message: string, details?: any) => {
      const LogModel = unsafe(await getResourceAsset('log', 'model'))
      return LogModel.create({
        message,
        details,
        context: resourceName,
        owner: token?.user?._id
          // @ts-ignore
          || options?.parentContext?.token.user._id,
        created_at: new Date
      })
    },
    limitRate: (params: RateLimitingParams): any => {
      // @ts-ignore
      return limitRate(options?.parentContext, params)
    },
  }


  if( token ) {
    Object.assign(context, { token })
  }

  if( apiConfig ) {
    Object.assign(context, { apiConfig })
  }

  return context
}

export const createContext = async <
  TDescription extends Description,
  TCollections extends Collections,
  TAlgorithms extends Algorithms
>(options?: ContextOptions<TCollections, TAlgorithms>) => {
 const context = Object.assign({}, options?.parentContext || {})
 Object.assign(context, await internalCreateContext<TCollections, TAlgorithms>(options))

 if( options?.parentContext ) {
   Object.assign(context, {
     apiConfig: options.parentContext.apiConfig || {}
   })
 }

 return context as Context<TDescription, TCollections, TAlgorithms>
}
