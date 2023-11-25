import type { Description, Condition } from '@sonata-api/types'
import { evaluateCondition } from './evaluateCondition'

export const isRequired = (propName: string, required: NonNullable<Description['required']>, subject: any) => {
  if( Array.isArray(required) ) {
    return required.includes(propName)
  }

  if( !(propName in required) ) {
    return false
  }

  const requiredProp = required[propName as any] as Condition<any> | boolean
  if( typeof requiredProp === 'boolean' ) {
    return requiredProp
  }

  return evaluateCondition(subject, requiredProp).satisfied
}
