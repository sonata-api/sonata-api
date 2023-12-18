import type { Collection as MongoCollection } from 'mongodb'
import type { GenericRequest, GenericResponse } from './http'
import type { Description, PackReferences, Schema, FunctionPath, DecodedToken, ApiConfig, CollectionStructure } from '.'

export type CollectionModel<TDescription extends Description> =
  MongoCollection<Omit<PackReferences<Schema<TDescription>>, '_id'>>

export type Models = {
  [K in keyof Collections]: CollectionModel<Collections[K]['description']>
}

export type IndepthCollection<TCollection> = TCollection extends { functions: infer CollFunctions }
  ? Omit<TCollection, 'functions'> & {
    functions: {
      [FnName in keyof CollFunctions]: CollFunctions[FnName] extends infer Fn
        ? Fn extends (...args: [infer FnArgs, infer _FnContext, ...infer Rest]) => infer FnReturn
          ? (props: FnArgs, ...args: Rest) => FnReturn
          : never
        : never
    }
  }
  : TCollection

export type IndepthCollections = {
  [P in keyof Collections]: IndepthCollection<Collections[P]>
}

export type ContextOptions<TContext> = {
  apiConfig?: ApiConfig
  parentContext?: TContext
  collectionName?: string
  token?: DecodedToken
}

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

  log: (message: string, details?: any) => Promise<any>
  apiConfig: ApiConfig
}

