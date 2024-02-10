import { type Description, type PropertiesWithId } from './description'

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

export type TruthyCondition<TDescription extends Description> = {
  operator: 'truthy'
  term1: PropertiesWithId<TDescription>
}

export type OrCondition<TDescription extends Description> = {
  or: readonly Condition<TDescription>[]
}

export type AndCondition<TDescription extends Description> = {
  and: readonly Condition<TDescription>[]
}

export type NotCondition<TDescription extends Description> = {
  not: Condition<TDescription>
}

export type Condition<TDescription extends Description> =
  | FinalCondition<TDescription>
  | TruthyCondition<TDescription>
  | AndCondition<TDescription>
  | OrCondition<TDescription>
  | NotCondition<TDescription>

