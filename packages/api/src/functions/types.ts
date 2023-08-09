export type UploadAuxProps = {
  parentId: string
  propertyName: string
}

export type Filters<T> = Record<`$${string}`, any> & {
  [P in keyof T]?: '_id' extends keyof T[P]
    ? T[P] | Record<`$${string}`, any> | string
    : T[P] | Record<`$${string}`, any>
}

export type What<T> = Record<`$${string}`, any> & {
  [P in keyof T]?: '_id' extends keyof T[P]
    ? T[P] | string
    : T[P]
}

export type Projection<T> = Array<keyof T>|Record<keyof T, number>
export type QuerySort<T> = Record<keyof T, 1|-1>
