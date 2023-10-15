import type { Schema } from '@sonata-api/api'
import type { Description, CollectionProperty } from '@sonata-api/types'
import { isLeft, left, right, unwrapEither } from '@sonata-api/common'
import {
  ValidationErrorCodes,
  ValidateOptions,
  PropertyValidationErrorType,
  PropertyValidationError,
  ValidationError

} from './types'


const getValueType = (value: any) => {
  return Array.isArray(value)
    ? 'array'
    : typeof value
}

const getPropertyType = (property: CollectionProperty) => {
  if(
    property.$ref
    || property.properties
    || property.additionalProperties
  ) {
    return 'object'
  }

  if( property.enum ) {
    return typeof property.enum[0]
  }

  return property.type
}

const makePropertyError = <
  TType extends PropertyValidationErrorType,
  TDetails extends PropertyValidationError['details'],
>(type: TType, details: TDetails) => {
  return {
    type,
    details
  } satisfies PropertyValidationError
}

export const makeValidationError = <TValidationError extends ValidationError> (error: TValidationError) => {
  return error as ValidationError
}

export const validateProperty = async (
  propName: Lowercase<string>,
  what: Record<string, any>,
  property: CollectionProperty,
  options: ValidateOptions = {}
) => {
  const value = what && typeof what === 'object' && propName in what
    ? what[propName]
    : what

  const {
    extraneous
  } = options

  if( value === null ) {
    return
  }

  if( (Array.isArray(extraneous) && extraneous.includes(propName)) || !property ) {
    return makePropertyError('extraneous', {
      expected: 'undefined',
      got: getValueType(value)
    })
  }

  const expectedType = getPropertyType(property)!
  const actualType = getValueType(value)

  if( options.recurse && expectedType === 'object' ) {
    const resultEither = await validate(property as Required<Description>, what[propName], options)

    if( isLeft(resultEither) ) {
      return unwrapEither(resultEither)
    }
  }

  if( actualType !== expectedType && !(expectedType === 'array' && actualType === 'array') ) {
    return makePropertyError('unmatching', {
      expected: expectedType,
      got: actualType
    })
  }

  if( expectedType === 'number' ) {
    if(
      (property.maximum && property.maximum < value)
    || (property.minimum && property.minimum > value)
    || (property.exclusiveMaximum && property.exclusiveMaximum <= value)
    || (property.exclusiveMinimum && property.exclusiveMinimum >= value)
    ) {
      return makePropertyError('numeric_constraint', {
        expected: 'number',
        got: 'invalid_number'
      })
    }
  }

  else if( property.enum ) {
    if( !property.enum.includes(value) ) {
      return makePropertyError('extraneous_element', {
        expected: property.enum,
        got: value
      })
    }
  }

  else if( expectedType === 'array' ) {
    for( const elem of value ) {
      const result = await validateProperty(propName, elem, property.items!, options) as PropertyValidationError | undefined

      if( result ) {
        return result
      }
    }
  }

  else if( property.s$getter ) {
    return makePropertyError('unmatching', {
      expected: 'getters are read-only',
      got: actualType
    })
  }
}

export const validateWholeness = (description: Omit<Description, '$id'>, what: Record<Lowercase<string>, any>) => {
  const required = description.required
    ? description.required
    : Object.keys(description.properties)

  for( const propName of required ) {
    if( !what[propName as Lowercase<string>] ) {
      return makeValidationError({
        code: ValidationErrorCodes.MissingProperties,
        missing: required.filter((prop) => !Object.keys(what).includes(prop as string)) as string[]
      })
    }
  }
}

export const validate = async <
  TWhat extends Record<Lowercase<string>, any>,
  TDescription extends Omit<Description, '$id'>
>(
  what: TWhat | undefined,
  description: TDescription,
  options: ValidateOptions = {}
) => {
  if( !what ) {
    return left(makeValidationError({
      code: ValidationErrorCodes.EmptyTarget,
      errors: {}
    }))
  }

  const wholenessError = validateWholeness(description, what)
  if( wholenessError ) {
    return left(wholenessError)
  }

  const errors: Record<string, PropertyValidationError | ValidationError> = {}

  for( const propName in what ) {
    const result = await validateProperty(
      propName as Lowercase<string>,
      what,
      description.properties?.[propName as Lowercase<string>],
      options
    )

    if( result ) {
      errors[propName] = result
    }
  }

  if( Object.keys(errors).length > 0 ) {
    if( options.throwOnError ) {
      const error = new TypeError(ValidationErrorCodes.InvalidProperties)
      Object.assign(error, { errors })
      throw error
    }

    return left(makeValidationError({
      code: ValidationErrorCodes.InvalidProperties,
      errors
    }))
  }

  return right(what as Schema<TDescription>)
}
