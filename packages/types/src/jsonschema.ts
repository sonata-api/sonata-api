import type { Description } from '.'
import type { CollectionProperty } from '.'

export type PropertyFormat = 
  | 'date'
  | 'date-time'

export type JsonSchema<TDescription extends Description=any> = {
  $id: string
  required?: ReadonlyArray<keyof TDescription['properties']>
  presets?: ReadonlyArray<keyof TDescription['properties']>
  properties: Record<Lowercase<string>, CollectionProperty>
}

export type RefType = {
  $ref: keyof Collections & string
}

export type EnumType = {
  enum: ReadonlyArray<any>
}

export type ArrayType = {
  type: 'array'
  items: Property
  uniqueItems?: boolean
  minItems?: number
  maxItems?: number
}

export type ObjectType = {
  type: 'object'
  properties?: Record<string, CollectionProperty>
  additionalProperties?: Property
}

export type StringType = {
  type: 'string'
  minLength?: number
  maxLength?: number
  format?: PropertyFormat
}

export type NumberType = {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
}

export type BooleanType = {
  type: 'boolean'
}

export type PropertyAux =
  | RefType
  | EnumType
  | ArrayType
  | ObjectType
  | StringType
  | NumberType
  | BooleanType

export type Property = PropertyAux & {
  default?: any
  description?: string
  readOnly?: boolean
}
