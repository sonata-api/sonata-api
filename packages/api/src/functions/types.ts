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

export type Projection<TDocument extends Record<Lowercase<string>, any>> =
  keyof TDocument | '_id' extends infer DocumentProp
    ? DocumentProp extends Lowercase<string>
      ? 
        | Array<DocumentProp>
        | Record<DocumentProp, number>
      : never
    : never

export type QuerySort<TDocument> = Record<keyof WithId<TDocument>, 1|-1>

export type Document<TDocument> = Pick<
  TDocument,
  Extract<keyof TDocument, Lowercase<string>>
>

