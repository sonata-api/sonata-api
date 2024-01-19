import type { Description, Condition, PropertiesWithId } from '.'

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

export type RequiredProperties<TDescription extends Description> = ReadonlyArray<PropertiesWithId<TDescription>> | Partial<Record<
  PropertiesWithId<TDescription>,
  Condition<TDescription> | boolean
>>

export type JsonSchema<TJsonSchema extends JsonSchema = any> = {
  $id: string
  type?: 'object'
  required?: RequiredProperties<TJsonSchema>
  properties: Record<string, Property>
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

export type LiteralProperty = {
  literal: string | number | boolean
}

export type GetterProperty = {
  getter: (getter: any)=> any
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
  | LiteralProperty
  | GetterProperty

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

  isTimestamp?: boolean
}

export type Property = MixedProperty & PropertyBase
