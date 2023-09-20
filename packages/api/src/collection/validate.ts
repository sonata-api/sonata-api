import type { Description, CollectionProperty } from '@sonata-api/types'
import { left, right } from '@sonata-api/common'
import { Types } from 'mongoose'
import { getTypeConstructor } from './typemapping'

export enum ValidationErrors {
  EmptyTarget = 'EMPTY_TARGET',
  InvalidProperties = 'INVALID_PROPERTIES'
}

export type ValidateOptions<TDescription extends Omit<Description, '$id'>> = {
  required?: Array<keyof TDescription['properties']>|null
  extraneous?: Array<string>|boolean
  throwOnError?: boolean
}


export type DetailedErrors = Record<string, {
  type: 'extraneous'
  | 'missing'
  | 'unmatching'
  | 'extraneous_element'
  | 'numeric_constraint'
  details: {
    expected: string
    got: string
  }
}>

const isValidReference = (property: CollectionProperty, value: any) => {
  if( !property.s$isReference ) {
    return false
  }

  try {
    new Types.ObjectId(value)
    return true
  } catch(e) {
    return false
  }
}

export const validateFromDescription = async <
  const TDescription extends Omit<Description, '$id'>,
  const TWhat extends Record<string, any>
>(
  description: TDescription,
  what: TWhat,
  options?: ValidateOptions<TDescription>
) => {
  const { 
    required,
    extraneous,
    throwOnError

  } = options || {}

  if( !what ) {
    return left({
      code: ValidationErrors.EmptyTarget as ValidationErrors,
      errors: {} as DetailedErrors
    })
  }

  const propsSet = required
    ? new Set([ ...required, ...Object.keys(what) ])
    : new Set([ ...Object.keys(description.properties), ...Object.keys(what) ])

  const getType = (value: any) => {
    return Array.isArray(value)
      ? 'array'
      : typeof value
  }

  const errors: DetailedErrors = {}

  for( const _prop of propsSet ) {
    const prop = _prop as Lowercase<string>
    const value = what[prop as keyof TWhat]
    const property = description.properties[prop]

    if( prop === '_id' && typeof value === 'string' ) {
      continue
    }

    if(
      (Array.isArray(extraneous) && extraneous.includes(prop))
      || (!property && !extraneous)
    ) {
      errors[prop] = {
        type: 'extraneous',
        details: {
          expected: 'undefined',
          got: getType(value)
        }
      }

      continue
    }

    if( !value ) {
      if(
        (!required && description.required?.includes(prop))
        || (required && required.includes(prop as Lowercase<string>))
      ) {
        errors[prop] = {
          type: 'missing',
          details: {
            expected: property.type as string,
            got: 'undefined'
          }
        }
      }

      continue
    }

    if( !description.properties[prop] ) {
      continue
    }

    const expectedConstructor = await getTypeConstructor(description.properties[prop], () => null)
    const actualConstructor = (value as any).constructor

    if( expectedConstructor === Number ) {
      if(
          (property.maximum && property.maximum < <number>value)
          || (property.minimum && property.minimum > <number>value)
          || (property.exclusiveMaximum && property.exclusiveMaximum <= <number>value)
          || (property.exclusiveMinimum && property.exclusiveMinimum >= <number>value)
      ) {
        errors[prop] = {
          type: 'numeric_constraint',
          details: {
            expected: 'number',
            got: 'invalid_number'
          }
        }
      }
    }

    if(
      actualConstructor !== expectedConstructor
      && !(Array.isArray(expectedConstructor) && actualConstructor === Array)
      && !(isValidReference(property, value))
    ) {
      errors[prop] = {
        type: 'unmatching',
        details: {
          expected: property.type as string,
          got: getType(value)
        }
      }
    }

    if( Array.isArray(expectedConstructor) ) {
      const extraneous = (value as Array<any>).find((v) => (
        v.constructor !== expectedConstructor[0]
          && !isValidReference(property, v)
      ))

      if( extraneous ) {
        errors[prop] = {
          type: 'extraneous_element',
          details: {
            expected: getType(expectedConstructor[0]()),
            got: getType(extraneous)
          }
        }
      }
    }
  }

  if( Object.keys(errors).length > 0 ) {
    if( throwOnError ) {
      const error = new TypeError(ValidationErrors.InvalidProperties)
      Object.assign(error, { errors })
      throw error
    }

    return left({
      code: ValidationErrors.InvalidProperties,
      errors
    })
  }

  return right(what)
}
