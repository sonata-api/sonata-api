import type { Property } from './jsonschema'
import type { Condition } from './condition'

export type PropertiesWithId<TDescription extends Description> =
  keyof TDescription['properties'] | '_id'

export type CollectionPresets = 
  | 'crud'
  | 'duplicate'
  | 'delete'
  | 'deleteAll'
  | 'owned'
  | 'timestamped'
  | 'toggleActive'
  | 'view'

export type CollectionId = string

export type CollectionAction<TDescription extends Description> = Readonly<{
  name: string
  icon?: string
  ask?: boolean
  selection?: boolean
  effect?: string
  button?: boolean

  // route namespace
  setItem?: boolean
  fetchItem?: boolean
  clearItem?: boolean
  params?: Record<string, any>
  query?: Record<string, any>

  requires?: PropertiesWithId<TDescription>[]
}>

export type CollectionActions<TDescription extends Description> =
  Record<string, null|CollectionAction<TDescription>>

export type FormLayout<TDescription extends Description> = {
  fields?: Partial<Record<PropertiesWithId<TDescription>, FormLayoutField<TDescription>>>
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
    button?: boolean | Condition<TDescription>
    if?: Condition<TDescription>
  }>>
}

export type FiltersPreset<TDescription extends Description> = {
  name?: string
  icon?: string
  filters: Partial<Record<PropertiesWithId<TDescription> | `$${string}`, any>>
  table?: PropertiesWithId<TDescription>[]
  badgeFunction?: string
  default?: boolean
}

export type CollectionOptions<TDescription extends Description> = {
  queryPreset?: {
    filters?: Partial<Record<PropertiesWithId<TDescription> | `$${string}`, any>>
    sort?: Partial<Record<PropertiesWithId<TDescription>, any>>
  }
}

export type LayoutName =
  | 'tabular'
  | 'grid'
  | 'list'

export type LayoutOptions<TDescription extends Description=any> = {
  picture?: PropertiesWithId<TDescription>
  title?: PropertiesWithId<TDescription>
  badge?: PropertiesWithId<TDescription>
  information?: PropertiesWithId<TDescription>
  active?: PropertiesWithId<TDescription>
  translateBadge?: boolean
}

export type Layout<TDescription extends Description=any> = {
  name: LayoutName
  options?: LayoutOptions<TDescription>
}

export type SearchOptions = {
  active: boolean
  placeholder?: string
}

export type Description<TDescription extends Description=any> = {
  $id: CollectionId
  title?: string

  // unused
  categories?: string[]

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
  timestamps?: false
  immutable?: boolean | ReadonlyArray<string>

  // takes an array of something
  route?: ReadonlyArray<string>
  presets?: ReadonlyArray<CollectionPresets>
  required?: ReadonlyArray<PropertiesWithId<TDescription>>
  table?: ReadonlyArray<PropertiesWithId<TDescription>>
  tableMeta?: ReadonlyArray<PropertiesWithId<TDescription>>

  filtersPresets?: Record<string, FiltersPreset<TDescription>>
  freshItem?: Partial<Record<PropertiesWithId<TDescription>, any>>

  form?: ReadonlyArray<PropertiesWithId<TDescription>>|Record<PropertiesWithId<TDescription>, string[]>
  writable?: ReadonlyArray<PropertiesWithId<TDescription>>
  filters?: ReadonlyArray<PropertiesWithId<TDescription>|{
    property: PropertiesWithId<TDescription>
    default: string
  }>

  layout?: Layout<TDescription>
  formLayout?: Partial<FormLayout<TDescription>>
  tableLayout?: Partial<TableLayout<TDescription>>

  // actions
  actions?: CollectionActions<TDescription>
  individualActions?: CollectionActions<TDescription>

  search?: SearchOptions
  properties: Record<Lowercase<string>, CollectionProperty>
}

export type CollectionProperty = Property & {
  [P in keyof CollectionPropertyAux as `s$${P}`]: CollectionPropertyAux[P]
}

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

type CollectionPropertyAux = {
  icon?: string
  element?: PropertyElement
  inputType?: PropertyInputType
  placeholder?: string
  hint?: string
  translate?: boolean

  mask?: string|ReadonlyArray<string>
  form?: ReadonlyArray<string>

  focus?: boolean
  noLabel?: boolean
  noForm?: boolean
  hidden?: boolean
  purge?: boolean
  unique?: boolean

  /** @see SvFile */
  accept?: ReadonlyArray<string>
  componentProps?: Record<string, any>

  isReference?: boolean
  isFile?: boolean
  isGetter?: boolean
  referencedCollection?: string

  indexes?: ReadonlyArray<string>
  populate?: ReadonlyArray<string>
  select?: ReadonlyArray<string>
  inline?: boolean

  getter?: (value: any) => any
}
