import { Description, PropertiesWithId } from './description'

export type FinalCondition<TDescription extends Description> = {
  operator:
    | 'equal'
    | 'in'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
  term1: PropertiesWithId<TDescription>
  term2: any
  else?: any
}

export type OrCondition<TDescription extends Description> = {
  or: Condition<TDescription>[]
}

export type AndCondition<TDescription extends Description> = {
  and: Condition<TDescription>[]
}

export type ExistsCondition<TDescription extends Description> = {
  operator: 'exists'
  term1: PropertiesWithId<TDescription>
}

export type NotCondition<TDescription extends Description> = {
  not: Condition<TDescription>
}

export type Condition<TDescription extends Description> =
  | FinalCondition<TDescription>
  | ExistsCondition<TDescription>
  | NotCondition<TDescription>
  | OrCondition<TDescription>
  | AndCondition<TDescription>

