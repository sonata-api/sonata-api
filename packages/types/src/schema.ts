import type { JsonSchema } from './property'
import type { ObjectId } from 'mongodb'

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

type MapType<T> = T extends TestType<{ format: 'date'|'date-time' }>
  ? Date        : T extends TestType<{ type: 'string' }>
  ? string      : T extends TestType<{ type: 'number' }>
  ? number      : T extends TestType<{ type: 'boolean' }>
  ? boolean     : T extends TestType<{ properties: any }>
  ? Omit<Schema<T>, '_id'>   : T extends TestType<{ type: 'object' }>
  ? object      : T extends TestType<{ enum: ReadonlyArray<infer K> }>
  ? K           : T extends TestType<{ $ref: string }>
  ? ObjectId    : never

type CaseReference<T> = T extends { $id: string }
  ? ObjectId
  : T extends TestType<{ type: 'array', items: { properties: any } }>
    ? MapType<T['items']>[]
    : T extends TestType<{ type: 'array', items: infer K }>
      ? MapType<K>[]
      : MapType<T>

type Type<T> = CaseReference<T>

type FilterReadonlyProperties<TProperties> = {
  [P in keyof TProperties as TProperties[P] extends { readOnly: true }
    ? P
    : never
  ]: Type<TProperties[P]>
}

type CombineProperties<TProperties> = FilterReadonlyProperties<TProperties> extends infer ReadonlyProperties
  ? Readonly<ReadonlyProperties> & {
    [P in Exclude<keyof TProperties, keyof ReadonlyProperties>]: Type<TProperties[P]>
  }
  : never

type MapTypes<
  TSchema extends Subschema,
  Properties=TSchema['properties']
> = 
  CombineProperties<Properties> extends infer MappedTypes
    ? TSchema extends { required: [] }
      ? MappedTypes
      : TSchema extends { required: (infer RequiredProp)[] }
        ? RequiredProp extends keyof MappedTypes
          ? Pick<MappedTypes, RequiredProp> extends infer RequiredProps
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

