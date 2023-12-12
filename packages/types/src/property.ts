import type { Description, Condition, RequiredProperties } from '.'

export type PropertyArrayElement =
  | 'checkbox'
  | 'radio'
  | 'select'

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
  required?: RequiredProperties<TDescription>
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
  purge?: boolean

  constraints?: Condition<any>
}

export type FileProperty = Omit<RefProperty, '$ref'> & {
  $ref: 'file'
  accept?: ReadonlyArray<string>
}

export type EnumProperty = {
  enum: ReadonlyArray<any>
  default?: any
  element?: PropertyArrayElement
}

export type ArrayProperty = {
  type: 'array'
  items: Property
  uniqueItems?: boolean
  minItems?: number
  maxItems?: number
  element?: PropertyArrayElement
}

export type FixedObjectProperty = {
  properties: Record<string, Property>
  form?: ReadonlyArray<string>
  required?: ReadonlyArray<string>
}

export type VariableObjectProperty = {
  additionalProperties?: Property
}

export type ObjectProperty = (FixedObjectProperty | VariableObjectProperty) & {
  type: 'object'
  default?: any
}

export type StringProperty = {
  type: 'string'
  minLength?: number
  maxLength?: number
  format?: PropertyFormat
  default?: string | Date
  mask?: string | ReadonlyArray<string>

  placeholder?: string
  element?: 'textarea'
  inputType?: PropertyInputType
}

export type NumberProperty = {
  type:
    | 'number'
    | 'integer'
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
  element?: 'checkbox'
}

export type ArrayOfRefs = Omit<ArrayProperty, 'items'> & {
  items: RefProperty
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

export type PropertyBase = {
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
  unique?: boolean

  isReference?: boolean
  isFile?: boolean
  isGetter?: boolean
  referencedCollection?: string

  getter?: (value: any) => any
}

export type Property = MixedProperty & PropertyBase
