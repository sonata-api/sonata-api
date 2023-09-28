import type { JsonSchema } from '@sonata-api/types'
import type { ObjectId } from '../types'

export type Schema<T extends JsonSchema> = CaseOwned<T>

type Owned = {
  owner?: ObjectId
}

type TestType<T> = T & Record<string, any>

type MapType<T> = T extends TestType<{ format: 'date'|'date-time' }>
  ? Date        : T extends TestType<{ type: 'string' }>
  ? string      : T extends TestType<{ type: 'number' }>
  ? number      : T extends TestType<{ type: 'boolean' }>
  ? boolean     : T extends TestType<{ properties: any }>
  ? Schema<T & { $id: '' }> : T extends TestType<{ type: 'object' }>
  ? object      : T extends TestType<{ enum: ReadonlyArray<infer K> }>
  ? K           : T extends TestType<{ $ref: string }>
  ? ObjectId    : never

type CaseReference<T> = T extends { $id: string }
  ? ObjectId
  : T extends TestType<{ type: 'array', items: { properties: any } }>
    ? Array<MapType<T['items']>>
    : T extends TestType<{ type: 'array', items: infer K }>
      ? Array<MapType<K>>
      : MapType<T>

type Type<T> = CaseReference<T>

type IsRequired<
  F,
  ExplicitlyRequired
> = keyof {
  [
    P in keyof F as
    P extends ExplicitlyRequired[keyof ExplicitlyRequired]
      ? P
      : never
  ]: F[P]
}

type IsReadonly<F> = keyof {
  [
    P in keyof F as
    F[P] extends { readOnly: true }
      ? P
      : never
  ]: F[P]
}

type RequiredProperties<F, E> = IsRequired<F, E>
type ReadonlyProperties<F> = IsReadonly<F>

type OptionalProperties<F, E> = Exclude<keyof F, RequiredProperties<F, E> | ReadonlyProperties<F>>

type MapTypes<
  S extends JsonSchema,
  F=S['properties'],
  ExplicitlyRequired=S['required']
> = 
  { [P in OptionalProperties<F, ExplicitlyRequired>]?: Type<F[P]> } &
  { -readonly [P in RequiredProperties<F, ExplicitlyRequired>]: Type<F[P]> } &
  { readonly [P in ReadonlyProperties<F>]?: Type<F[P]> }

type CaseOwned<T extends JsonSchema> = T extends { owned: true | string }
  ? Owned & MapTypes<T>
  : MapTypes<T>
