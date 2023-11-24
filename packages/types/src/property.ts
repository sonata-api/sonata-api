import type { Description, Condition } from '.'

export type PropertyElement =
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'textarea'

export type PropertyInputType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'time'
  | 'month'


export type PropertyFormat = 
  | 'date'
  | 'date-time'

export type JsonSchema<TDescription extends Description=any> = {
  $id: string
  required?: ReadonlyArray<keyof TDescription['properties']>
  presets?: ReadonlyArray<keyof TDescription['properties']>
  properties: Record<Lowercase<string>, Property>
}

export type RefProperty = {
  $ref: Exclude<keyof Collections, 'file'> & string

  indexes?: ReadonlyArray<string>
  populate?: ReadonlyArray<string>
  select?: ReadonlyArray<string>
  inline?: boolean
  form?: ReadonlyArray<string>

  constraints?: Condition<any>
}

export type FileProperty = Omit<RefProperty, '$ref'> & {
  $ref: 'file'
  accept?: ReadonlyArray<string>
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
  properties?: Record<string, Property>
  additionalProperties?: Property
  default?: any
  form?: ReadonlyArray<string>
}

export type StringProperty = {
  type: 'string'
  minLength?: number
  maxLength?: number
  format?: PropertyFormat
  default?: string | Date
  mask?: string | ReadonlyArray<string>

  placeholder?: string
  element?: PropertyElement
  inputType?: PropertyInputType
}

export type NumberProperty = {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  default?: number

  placeholder?: string
}

export type BooleanProperty = {
  type: 'boolean'
  default?: boolean
}

export type MixedProperty =
  | RefProperty
  | FileProperty
  | EnumProperty
  | ArrayProperty
  | ObjectProperty
  | StringProperty
  | NumberProperty
  | BooleanProperty

export type Property = MixedProperty & {
  description?: string
  readOnly?: boolean
  focus?: boolean

  icon?: string
  translate?: boolean
  hint?: string
  componentProps?: Record<string, any>

  noForm?: boolean
  noLabel?: boolean
  hidden?: boolean
  purge?: boolean
  unique?: boolean

  isReference?: boolean
  isFile?: boolean
  isGetter?: boolean
  referencedCollection?: string

  getter?: (value: any) => any
}
