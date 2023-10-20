import type { Description } from '@sonata-api/types'
import type { GenericRequest, GenericResponse } from '@sonata-api/http'
import type { Collection as MongoCollection } from 'mongodb'
import type { Schema } from './collection'
import type {
  FunctionPath,
  DecodedToken,
  ApiConfig,
  Collection,
  CollectionStructure,

} from './types'

import { validate } from '@sonata-api/validation'
import { getDatabaseCollection } from './database'
import { preloadDescription } from './collection/preload'
import { unsafe } from '@sonata-api/common'

type CollectionModel<TDescription extends Description> =
  MongoCollection<Omit<Schema<TDescription>, '_id'>>

type Models = {
  [K in keyof Collections]: CollectionModel<Collections[K]['description']>
}

type IndepthCollection<TCollection> = TCollection extends { functions: infer CollFunctions }
  ? Omit<TCollection, 'functions'> & {
    functions: {
      [FnName in keyof CollFunctions]: CollFunctions[FnName] extends infer Fn
        ? Fn extends (...args: [infer FnArgs, ...infer _Rest]) => infer FnReturn
          ? (props: FnArgs) => FnReturn
          : never
        : never
    }
  }
  : TCollection

type IndepthCollections = {
  [P in keyof Collections]: IndepthCollection<Collections[P]>
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
export type Context<TDescription extends Description=any> = {
  description: TDescription
  model: CollectionModel<TDescription>
  models: Models

  collection: TDescription['$id'] extends keyof Collections
    ? IndepthCollection<Collections[TDescription['$id']]>
    : IndepthCollection<CollectionStructure>

  collections: IndepthCollections

  functionPath: FunctionPath
  token: DecodedToken

  collectionName?: (keyof Collections & string) | string
  request: GenericRequest
  response: GenericResponse

  validate: typeof validate
  log: (message: string, details?: any) => Promise<any>

  apiConfig: ApiConfig
}
// #endregion Context

const indepthCollection = (collectionName: string, collections: Record<string, Collection>, parentContext: Context) => {
  const collection = collections[collectionName]?.() as CollectionStructure & {
    $functions: any
  }

  if( !collection.functions ) {
    return collection
  }

  collection.$functions = Object.assign({}, collection.functions)

  const proxiedFunctions = new Proxy<NonNullable<IndepthCollection<CollectionStructure>['functions']>>({}, {
    get: (_: unknown, functionName: string) => {
      return async (props: any) => {
        const childContext = await createContext({
          parentContext,
          collectionName
        })

        return collection.$functions[functionName](props, childContext)
      }
    }
  })

  collection.functions = proxiedFunctions
  return collection
}

export const internalCreateContext = async (
  options: Pick<ContextOptions<any>,
    | 'collectionName'
    | 'apiConfig'
    | 'token'
  >,
  parentContext: Context
) => {
  const {
    collectionName,
    token = {} as DecodedToken

  } = options || {}

  const { getCollections, getCollectionAsset } = await import('./assets')
  const collections = await getCollections()

  const context = Object.assign({}, parentContext)
  Object.assign(context, options)

  context.validate = validate
  context.log = async (message: string, details?: any) => {
    return getDatabaseCollection('log').insertOne({
      message,
      details,
      context: collectionName,
      owner: token?.user?._id
        // @ts-ignore
        || options?.parentContext?.token.user._id,
      created_at: new Date
    })
  }

  if( collectionName ) {
    const description = unsafe(await getCollectionAsset(collectionName as any, 'description'))
    context.description = await preloadDescription(description)

    context.collectionName = collectionName

    context.collection = indepthCollection(collectionName, collections, context)
    context.model = getDatabaseCollection(collectionName)
  }

  context.collections = new Proxy<IndepthCollections>({}, {
    get: (_: unknown, collectionName: string) => {
      return indepthCollection(collectionName, collections, context)
    }
  })

  context.models = new Proxy<Models>({} as Models, {
    get: (_, collectionName: string) => {
      return getDatabaseCollection(collectionName)
    }
  })

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

  Object.assign(context, await internalCreateContext(options, context))
  return context
}
