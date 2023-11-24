import { Description, PropertiesWithId } from './description'

type FinalCondition<TDescription extends Description> = {
  operator:
    | 'equal'
    | 'unequal'
    | 'in'
    | 'notin'
  term1: PropertiesWithId<TDescription>
  term2: any
  else?: any
}

type OrCondition<TDescription extends Description> = {
  or: Condition<TDescription>[]
}

type AndCondition<TDescription extends Description> = {
  and: Condition<TDescription>[]
}

type ExistsCondition<TDescription extends Description> = {
  operator: 'exists'
  term1: PropertiesWithId<TDescription>
}

type NotCondition<TDescription extends Description> = {
  not: Condition<TDescription>
}

export type Condition<TDescription extends Description> =
  | FinalCondition<TDescription>
  | ExistsCondition<TDescription>
  | NotCondition<TDescription>
  | OrCondition<TDescription>
  | AndCondition<TDescription>

