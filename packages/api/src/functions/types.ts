import type { FilterOperators } from 'mongodb'

export type UploadAuxProps = {
  parentId: string
  propertyName: Lowercase<string>
}

export type Filters<TDocument> = FilterOperators<TDocument>

export type What<T> = Record<`$${string}`, any> & {
  [P in keyof T]?: '_id' extends keyof T[P]
    ? T[P] | string
    : T[P]
}

export type Projection<T> = Array<keyof T>|Record<keyof T, number>
export type QuerySort<T> = Record<keyof T, 1|-1>
