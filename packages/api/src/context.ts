import type {
  Context,
  ContextOptions,
  IndepthCollection,
  IndepthCollections,
  DecodedToken,
  Collection,
  CollectionStructure,
  Models

} from '@sonata-api/types'

import { unsafe } from '@sonata-api/common'
import { getCollections } from '@sonata-api/entrypoint'
import { getDatabaseCollection } from './database'
import { preloadDescription } from './collection/preload'

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
      return async (props: any, ...args: any[]) => {
        const childContext = await createContext({
          parentContext,
          collectionName
        })

        return collection.$functions[functionName](props, childContext, ...args)
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

  const { getCollectionAsset } = await import('./assets')
  const collections = await getCollections()

  const context = Object.assign({}, parentContext)
  Object.assign(context, options)

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
