import type { FilterOperators, UpdateFilter, WithId } from 'mongodb'

export type UploadAuxProps = {
  parentId: string
  propertyName: Lowercase<string>
}

export type Filters<TDocument> = FilterOperators<TDocument>

export type What<TDocument> = UpdateFilter<TDocument> & {
  [P in keyof TDocument]?: '_id' extends keyof TDocument[P]
    ? TDocument[P] | string
    : TDocument[P]
}

export type Projection<TDocument> =
  | Array<keyof WithId<TDocument>>
  | Record<keyof WithId<TDocument>, number>

export type QuerySort<TDocument> = Record<keyof WithId<TDocument>, 1|-1>
