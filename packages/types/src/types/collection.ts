import { COLLECTION_PRESETS, STORE_EFFECTS, } from '../constants'
import type { Property } from './jsonschema'

export type CollectionPresets = typeof COLLECTION_PRESETS[number]

export type StoreEffect = keyof typeof STORE_EFFECTS
export type CollectionId = string

export type CollectionAction<TDescription extends Description> = Readonly<{
  name: string
  icon?: string
  ask?: boolean
  selection?: boolean
  effect?: StoreEffect

  // route namespace
  fetchItem?: boolean
  clearItem?: boolean
  params?: Record<string, any>
  query?: Record<string, any>

  requires?: Array<keyof TDescription['properties']>
}>

export type CollectionActions<TDescription extends Description> =
  Record<string, null|CollectionAction<TDescription>>

export type Condition<TDescription extends Description> = {
  operator:
    'equal'
    | 'unequal'
    | 'in'
    | 'notin'
  term1: keyof TDescription['properties']
  term2: any
  else?: any
}

export type FormLayout<TDescription extends Description> = {
  fields?: Partial<Record<keyof TDescription['properties'], FormLayoutField<TDescription>>>
}

export type FormLayoutField<TDescription extends Description> = {
  span?: number
  verticalSpacing?: number
  if?: Condition<TDescription>
  component?: {
    name: string
    props?: Record<string, any>
  }
}

export type TableLayout<TDescription extends Description> = {
  actions: Partial<Record<keyof TDescription['individualActions'], {
    button?: boolean
    if?: Condition<TDescription>
  }>>
}

export type FiltersPreset<TDescription extends Description> = {
  name?: string
  icon?: string
  filters: Partial<Record<keyof TDescription['properties'] | `$${string}`, any>>
  table?: Array<keyof TDescription['properties']>
  badgeFunction?: string
}

export type CollectionOptions<TDescription extends Description> = {
  queryPreset?: {
    filters?: Partial<Record<keyof TDescription['properties'] | `$${string}`, any>>
    sort?: Partial<Record<keyof TDescription['properties'], any>>
  }
}

export type LayoutName =
  'tabular'
  | 'grid'

export type LayoutOptions = {
  picture?: string
  title?: string
  description?: string
}

export type Layout = {
  name: LayoutName
  options?: LayoutOptions
}

// #region Description
export type Description<TDescription extends Description=any> = {
  $id: CollectionId
  title?: string

  // unused
  categories?: Array<string>

  system?: boolean
  inline?: boolean

  preferred?: Record<string, Partial<TDescription | Description>>

  alias?: string
  icon?: string
  options?: CollectionOptions<TDescription>

  indexes?: ReadonlyArray<string>
  defaults?: Record<string, any>

  // modifiers
  owned?: boolean | 'always'
  immutable?: boolean|ReadonlyArray<string>

  // takes an array of something
  route?: ReadonlyArray<string>
  presets?: ReadonlyArray<CollectionPresets>
  required?: ReadonlyArray<keyof TDescription['properties']>
  table?: ReadonlyArray<keyof TDescription['properties']>
  tableMeta?: ReadonlyArray<keyof TDescription['properties']>

  filtersPresets?: Record<string, FiltersPreset<TDescription>>
  freshItem?: Partial<Record<keyof TDescription['properties'], any>>

  form?: ReadonlyArray<keyof TDescription['properties']>|Record<keyof TDescription['properties'], Array<string>>
  writable?: ReadonlyArray<keyof TDescription['properties']>
  filters?: ReadonlyArray<keyof TDescription['properties']|{
    property: keyof TDescription['properties']
    default: string
  }>

  layout?: Layout
  formLayout?: Partial<FormLayout<TDescription>>
  tableLayout?: Partial<TableLayout<TDescription>>

  // actions
  actions?: CollectionActions<TDescription>
  individualActions?: CollectionActions<TDescription>

  search?: {
    active: boolean
    placeholder?: string
  }

  properties: Record<Lowercase<string>, CollectionProperty>
}
// #endregion Description

export type CollectionProperty = Property & {
  [P in keyof CollectionPropertyAux as `s$${P}`]: CollectionPropertyAux[P]
}

export type PropertyElement =
  'select'
  | 'checkbox'
  | 'radio'
  | 'textarea'

export type PropertyInputType =
  'text'
  | 'email'
  | 'password'
  | 'search'
  | 'time'
  | 'month'

type CollectionPropertyAux = {
  icon?: string
  element?: PropertyElement
  inputType?: PropertyInputType
  placeholder?: string
  hint?: string
  translate?: boolean
  meta?: boolean

  mask?: string|ReadonlyArray<string>
  form?: ReadonlyArray<string>

  focus?: boolean
  noLabel?: boolean
  unique?: boolean
  hidden?: boolean
  purge?: boolean

  /** @see SvFile */
  readonly accept?: ReadonlyArray<string>
  componentProps?: Record<string, any>

  isReference?: boolean
  isFile?: boolean
  referencedCollection?: string
  preventPopulate?: boolean
  noId?: boolean
  prefetch?: boolean|number

  array?: boolean
  limit?: number
  indexes?: ReadonlyArray<string>
  select?: ReadonlyArray<string>
  maxDepth?: number
  inline?: boolean
  inlineEditing?: boolean
}
