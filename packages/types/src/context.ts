import type { Collection as MongoCollection } from 'mongodb'
import type { GenericRequest, GenericResponse } from './http'
import type {
  Description,
  PackReferences,
  SchemaWithId,
  FunctionPath,
  DecodedToken,
  ApiConfig,
  Collection,
  CollectionFunctions

} from '.'

export type CollectionModel<TDescription extends Description> =
  MongoCollection<Omit<PackReferences<SchemaWithId<TDescription>>, '_id'>>

export type Models = {
  [K in keyof Collections]: CollectionModel<Collections[K]['description']>
}

export type IndepthCollection<TCollection> = TCollection extends {
  functions: infer CollFunctions
  description: infer InferredDescription
}
  ? CollectionFunctions<SchemaWithId<InferredDescription>> extends infer Functions
    ? Omit<TCollection, 'functions'> & {
      functions: Omit<CollFunctions, keyof Functions> & Pick<Functions, Extract<keyof CollFunctions, keyof Functions>>
      originalFunctions: CollFunctions
    }
    : never
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

export type Context<TDescription extends Description = any> = {
  description: TDescription
  model: CollectionModel<TDescription>
  models: Models

  collection: TDescription['$id'] extends keyof Collections
    ? IndepthCollection<Collections[TDescription['$id']]>
    : IndepthCollection<Collection>

  collections: IndepthCollections

  functionPath: FunctionPath
  token: DecodedToken

  collectionName?: (keyof Collections & string) | string
  request: GenericRequest
  response: GenericResponse

  log: (message: string, details?: any) => Promise<any>
  apiConfig: ApiConfig
}

