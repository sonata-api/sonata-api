import { PROPERTY_TYPES, PROPERTY_FORMATS } from '../constants'
import type { Description } from '.'
import type { CollectionProperty } from '.'

export type PropertyType = typeof PROPERTY_TYPES[number]
export type PropertyFormat = typeof PROPERTY_FORMATS[number]

export type JsonSchema<TDescription extends Description=any> = {
  $id: string
  required?: ReadonlyArray<keyof TDescription['properties']>
  presets?: ReadonlyArray<keyof TDescription['properties']>
  properties: Record<Lowercase<string>, CollectionProperty>
}

export type RefType = {
  $ref: string
}

export type EnumType = {
  enum: ReadonlyArray<any>
}

export type PrimitiveType = {
  type: PropertyType
}

export type PropertyAux =
  { [P in keyof RefType]?: RefType[P] } &
  { [P in keyof EnumType]?: EnumType[P] } &
  { [P in keyof PrimitiveType]?: PrimitiveType[P] }

export type Property = /* (RefType | EnumType | PrimitiveType) & */ PropertyAux &  {
  properties?: Record<string, CollectionProperty>
  additionalProperties?: Property
  format?: PropertyFormat

  default?: any
  description?: string
  items?: Property

  readOnly?: boolean
  uniqueItems?: boolean

  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number

  minItems?: number
  maxItems?: number

  minLength?: number
  maxLength?: number
}
