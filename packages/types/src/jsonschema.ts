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

export type RefProperty = {
  $ref: keyof Collections & string
}

export type EnumProperty = {
  enum: ReadonlyArray<any>
  default?: any
}

export type ArrayProperty = {
  type: 'array'
  items: Property
  uniqueItems?: boolean
  minItems?: number
  maxItems?: number
}

export type ObjectProperty = {
  type: 'object'
  properties?: Record<string, CollectionProperty>
  additionalProperties?: Property
  default?: any
}

export type StringProperty = {
  type: 'string'
  minLength?: number
  maxLength?: number
  format?: PropertyFormat
  default?: string | Date
}

export type NumberProperty = {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  default?: number
}

export type BooleanProperty = {
  type: 'boolean'
  default?: boolean
}

export type PropertyAux =
  | RefProperty
  | EnumProperty
  | ArrayProperty
  | ObjectProperty
  | StringProperty
  | NumberProperty
  | BooleanProperty

export type Property = PropertyAux & {
  description?: string
  readOnly?: boolean
}
