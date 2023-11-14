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
  or: Array<Condition<TDescription>>
}

type AndCondition<TDescription extends Description> = {
  and: Array<Condition<TDescription>>
}

export type Condition<TDescription extends Description> =
  | FinalCondition<TDescription>
  | OrCondition<TDescription>
  | AndCondition<TDescription>

