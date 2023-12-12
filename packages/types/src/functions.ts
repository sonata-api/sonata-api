import type { FilterOperators, UpdateFilter, WithId, OptionalId } from 'mongodb'

export type UploadAuxProps = {
  parentId: string
  propertyName: Lowercase<string>
}

export type Filters<TDocument> = FilterOperators<TDocument>

export type What<TDocument> = Omit<UpdateFilter<TDocument>, keyof TDocument> & {
  [P in keyof TDocument]?: '_id' extends keyof TDocument[P]
    ? TDocument[P] | string
    : TDocument[P]
}

export type Projection<TDocument extends Record<Lowercase<string>, any>> =
  keyof TDocument | '_id' extends infer DocumentProp
    ? TDocument extends Lowercase<string>
      ? DocumentProp[]
      : Lowercase<string>[]
    : never

export type QuerySort<TDocument> = Record<keyof WithId<TDocument>, 1|-1>

export type CollectionDocument<TDocument> = Pick<
  TDocument,
  Extract<keyof TDocument, Lowercase<string>>
>

export type GetPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters?: Filters<TDocument>
  project?: Projection<TDocument>
}

export type GetAllPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters?: Filters<TDocument>
  project?: Projection<TDocument>
  offset?: number
  limit?: number
  sort?: QuerySort<TDocument>
}

export type InsertPayload<TDocument extends CollectionDocument<any>> = {
  what: What<TDocument & { _id?: any }>
  project?: Projection<TDocument>
}

export type RemovePayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters: Filters<TDocument>
}

export type RemoveAllPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters: Filters<TDocument>
}

export type RemoveFilePayload = UploadAuxProps & {
  filters: {
    _id: any
  }
}

export type UploadPayload = UploadAuxProps & {
  what: {
    _id: string
  }
}