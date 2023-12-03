import { Description, PropertiesWithId } from './description'

export type FinalOperator =
  | 'equal'
  | 'in'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'

export type FinalCondition<TDescription extends Description> = {
  operator: FinalOperator
  term1: PropertiesWithId<TDescription>
  term2: any
  else?: any
}

export type ExistsCondition<TDescription extends Description> = {
  operator: 'exists'
  term1: PropertiesWithId<TDescription>
}

export type OrCondition<TDescription extends Description> = {
  or: Condition<TDescription>[]
}

export type AndCondition<TDescription extends Description> = {
  and: Condition<TDescription>[]
}

export type NotCondition<TDescription extends Description> = {
  not: Condition<TDescription>
}

export type Condition<TDescription extends Description> =
  | FinalCondition<TDescription>
  | ExistsCondition<TDescription>
  | AndCondition<TDescription>
  | OrCondition<TDescription>
  | NotCondition<TDescription>

