import type { ObjectId } from 'mongodb'
import type { JsonSchema } from './property'

export type Schema<TSchema extends Subschema> = { _id: ObjectId } & CaseTimestamped<
  TSchema,
  CaseOwned<
    TSchema,
    MapTypes<TSchema>
  >>

type Subschema = Omit<JsonSchema, '$id'>

type Owned = {
  owner?: ObjectId
}

type Timestamped = {
  updated_at?: Date
  created_at?: Date
}

type TestType<T> = T & Record<string, any>

type MapType<T> = T extends TestType<{ format: 'date' | 'date-time' }>
  ? Date        : T extends TestType<{ type: 'string' }>
  ? string      : T extends TestType<{ type: 'number' }>
  ? number      : T extends TestType<{ type: 'boolean' }>
  ? boolean     : T extends TestType<{ properties: any }>
  ? Omit<Schema<T & { timestamps: false }>, '_id'>   : T extends TestType<{ type: 'object' }>
  ? object      : T extends TestType<{ enum: ReadonlyArray<infer K> }>
  ? K           : T extends TestType<{ items: infer K }>
    ? MapType<K>[]
    : never

type MapReferences<TProperties> = {
  [
    P in keyof TProperties as TProperties[P] extends 
      | TestType<{ $ref: string }>
      | TestType<{ items: { $ref: string } }>
      ? P
      : never
  ]: TProperties[P] extends infer Prop
    ? Prop extends TestType<{ $ref: infer K }>
      ? K extends keyof Collections
        ? Collections[K]['item']
        : never
      : Prop extends TestType<{ items: TestType<{ $ref: infer K }> }>
        ? K extends keyof Collections
          ? Collections[K]['item'][]
          : never
        : never
    : never
}

export type PackReferences<T> = T extends Record<any, any>
  ? {
    [P in keyof T]: T[P] extends infer Prop
      ? Prop extends any[] | readonly any[]
        ? PackReferences<Prop[number]>[]
        : Prop extends { _id: infer Id }
          ? Id
          : Prop
      : never
  }
  : T

type FilterReadonlyProperties<TProperties> = {
  [P in keyof TProperties as TProperties[P] extends { readOnly: true }
    ? P
    : never
  ]: MapType<TProperties[P]>
}

type CombineProperties<TProperties> = FilterReadonlyProperties<TProperties> extends infer ReadonlyProperties
  ? Readonly<ReadonlyProperties> & {
    [P in Exclude<keyof TProperties, keyof ReadonlyProperties>]: MapType<TProperties[P]>
  }
  : never

type MergeReferences<TProperties> = CombineProperties<TProperties> extends infer CombinedProperties
  ? MapReferences<TProperties> extends infer MappedReferences
    ? MappedReferences & Omit<CombinedProperties, keyof MappedReferences>
    : never
  : never

type MapTypes<
  TSchema extends Subschema,
  Properties = TSchema['properties']
> = 
  MergeReferences<Properties> extends infer MappedTypes
    ? TSchema extends { required: readonly [] }
      ? Partial<MappedTypes>
      : TSchema extends { required: infer RequiredPropNames }
        ? RequiredPropNames extends readonly (keyof MappedTypes)[]
          ? Pick<MappedTypes, RequiredPropNames[number]> extends infer RequiredProps
            ? RequiredProps & Partial<Exclude<MappedTypes, keyof RequiredProps>>
            : never
          : never
        : MappedTypes
      : never

type CaseOwned<
  TSchema extends Subschema,
  TType
> = TSchema extends { owned: true | string }
  ? TType & Owned
  : TType

type CaseTimestamped<
  TSchema extends Subschema,
  TType
> = TSchema extends { timestamps: false }
  ? TType
  : TType & Timestamped

