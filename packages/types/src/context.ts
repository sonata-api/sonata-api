import type { Collection as MongoCollection } from 'mongodb'
import type { GenericRequest, GenericResponse } from './http'
import type {
  Description,
  PackReferences,
  SchemaWithId,
  FunctionPath,
  DecodedToken,
  ApiConfig,
  CollectionFunctions,
} from '.'

export type CollectionModel<TDescription extends Description> =
  MongoCollection<Omit<PackReferences<SchemaWithId<TDescription>>, '_id'>>

type OmitContextParameter<TFunctions> = {
  [P in keyof TFunctions]: TFunctions[P] extends infer Fn
    ? Fn extends (...args: any[])=> any
      ? Parameters<Fn> extends [infer Payload, Context, ...infer ExtraParameters]
        ? (payload: Payload, ...args: ExtraParameters)=> ReturnType<Fn>
        : Fn
      : never
    : never
}

export type IndepthCollection<TCollection> = TCollection extends {
  description: infer InferredDescription
  functions: infer CollFunctions

}
  ? CollectionFunctions<SchemaWithId<InferredDescription>> extends infer Functions
    ? Omit<TCollection, 'functions'> & {
      functions: Omit<OmitContextParameter<CollFunctions>, keyof Functions> & Pick<Functions, Extract<keyof CollFunctions, keyof Functions>>
      originalFunctions: CollFunctions
      model: InferredDescription extends Description
        ? CollectionModel<InferredDescription>
        : never
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

export type Context<TDescription extends Description = any, TFunctions = any> = {
  description: TDescription
  collection: TDescription['$id'] extends keyof Collections
    ? IndepthCollection<{ description: TDescription, functions: TFunctions }>
    : never

  collections: IndepthCollections

  functionPath: FunctionPath
  token: DecodedToken

  collectionName?: (keyof Collections & string) | string
  request: GenericRequest
  response: GenericResponse

  log: (message: string, details?: any)=> Promise<any>
  apiConfig: ApiConfig
}

