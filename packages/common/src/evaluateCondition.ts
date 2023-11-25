import type { Condition, Description } from '@sonata-api/types'
import { arraysIntersects } from './arraysIntersects'

const equalOrContains = (term1: any, term2: any) => {
  if( Array.isArray(term1) && Array.isArray(term2) ) {
    return arraysIntersects(term1, term2)
  }

  if( Array.isArray(term1) ) {
    return term1.includes(term2)
  }

  if( Array.isArray(term2) ) {
    return term1.includes(term1)
  }
}

const evaluatesToTrue = (subject: any, condition: Condition<any>): boolean => {
  if( 'term1' in condition ) {
    const term1 = subject[condition.term1]
    if( condition.operator === 'exists' ) {
      return !!term1
    }

    const { operator, term2 } = condition
    switch( operator ) {
      case 'equal': return term1 === term2
      case 'in': return equalOrContains(term1, term2)
      case 'gt': return term1 > term2
      case 'lt': return term1 < term2
      case 'gte': return term1 >= term2
      case 'lte': return term1 <= term2
    }
  }

  if( 'and' in condition ) {
    return condition.and.every((condition) => evaluatesToTrue(subject, condition))
  }

  if( 'or' in condition ) {
    return condition.or.some((condition) => evaluatesToTrue(subject, condition))
  }

  if( 'not' in condition ) {
    return !evaluatesToTrue(subject, condition.not)
  }

  return false
}

export const evaluateCondition = <TDescription extends Description=any>(subject: any, condition: Condition<TDescription>) => {
  const result = {
    satisfied: false,
    else: null
  }

  const satisfied = result.satisfied = evaluatesToTrue(subject, condition)
  if( !satisfied && 'else' in condition ) {
    result.else = condition.else
  }

  return result
}
