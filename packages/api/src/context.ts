import type { Description } from '@sonata-api/types'
import type { AccessControl } from '@sonata-api/access-control'
import type { MatchedRequest, GenericRequest, GenericResponse } from '@sonata-api/http'
import type { Collection } from 'mongodb'
import type { Schema } from './collection'
import type {
  FunctionPath,
  DecodedToken,
  ApiConfig,
  CollectionStructure,

} from './types'

import { validate } from '@sonata-api/validation'
import { getCollection } from './database'
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
  resourceName?: string
  token?: DecodedToken
}
// #endregion ContextOptions

// #region Context
export type Context<
  TDescription extends Description=any,
  TCollections extends Collections=any,
  TAccessControl extends AccessControl<TCollections, TAccessControl>=any
> = Omit<Awaited<ReturnType<typeof internalCreateContext>>,
  'resourceName'
  | 'collection'
  | 'collections'
  | 'accessControl'
  | 'model'
> & {
  description: TDescription
  model: CollectionModel<TDescription>
  collection: TDescription['$id'] extends keyof Collections
    ? TCollections[TDescription['$id']]
    : CollectionStructure
  collections: TCollections
  functionPath: FunctionPath
  token: DecodedToken<TAccessControl>

  resourceName?: keyof TCollections & string
  request: GenericRequest
  response: GenericResponse
  matched: MatchedRequest

  apiConfig: ApiConfig
  accessControl: TAccessControl
}
// #endregion Context

export const internalCreateContext = async (options?: Pick<ContextOptions<any>,
  'resourceName'
  | 'apiConfig'
  | 'token'
>) => {
  const {
    resourceName,
    apiConfig,
    token = {} as DecodedToken

  } = options || {}

  const { getResources, getResourceAsset, getAccessControl } = await import('./assets')
  const collections = await getResources()
  const accessControl = await getAccessControl()

  const context = {
    resourceName,
    accessControl,
    description: {},
    model: resourceName
      ? getCollection(resourceName)
      : {},
    collection: resourceName && await collections[resourceName](),
    collections: new Proxy<Collections>({}, {
      get: <TResourceName extends keyof typeof collections>(_: unknown, resourceName: TResourceName) => {
        return collections[resourceName]?.()
      }
    }),
    models: new Proxy<Models>({} as Models, {
      get: (_, key: keyof Collections) => {
        return getCollection(key)
      }
    }),

    validate,
    log: async (message: string, details?: any) => {
      return getCollection('log').insertOne({
        message,
        details,
        context: resourceName,
        owner: token?.user?._id
          // @ts-ignore
          || options?.parentContext?.token.user._id,
        created_at: new Date
      })
    },
  }

  if( resourceName ) {
    const description = unsafe(await getResourceAsset(resourceName as any, 'description'))
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
