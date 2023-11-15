import type { Condition, Description } from '@sonata-api/types'

const evaluatesToTrue = (subject: any, condition: Condition<any>): boolean => {
  if( 'term1' in condition ) {
    const term1 = subject[condition.term1]
    const { operator, term2 } = condition

    switch( operator ) {
      case 'equal': return term1 === term2
      case 'unequal': return term1 !== term2
      case 'in': return term2.includes(term1)
      case 'notin': return !term2.includes(term1)
    }
  }

  if( 'and' in condition ) {
    return condition.and.every((condition: any) => evaluatesToTrue(subject, condition))
  }

  if( 'or' in condition ) {
    return condition.or.some((condition: any) => evaluatesToTrue(subject, condition))
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
