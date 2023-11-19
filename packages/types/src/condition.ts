import { Description, PropertiesWithId } from './collection'

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

export type Condition<TDescription extends Description> =
  | FinalCondition<TDescription>
  | OrCondition<TDescription>
  | AndCondition<TDescription>

