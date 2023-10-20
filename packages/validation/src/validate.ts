import type { Schema } from '@sonata-api/api'
import type { Description, CollectionProperty } from '@sonata-api/types'
import { isLeft, left, right, unwrapEither } from '@sonata-api/common'
import {
  ValidationErrorCodes,
  PropertyValidationErrorType,
  PropertyValidationError,
  ValidationError

} from './types'

export type ValidateOptions = {
  extraneous?: Array<string>|boolean
  throwOnError?: boolean
  recurse?: boolean
}

const getValueType = (value: any) => {
  return Array.isArray(value)
    ? 'array'
    : typeof value
}

const getPropertyType = (property: CollectionProperty) => {
  if(
    '$ref' in property
    || 'properties' in property
    || 'additionalProperties' in property
  ) {
    return 'object'
  }

  if( 'enum' in property ) {
    return typeof property.enum[0]
  }

  if( 'format' in property ) {
    if (['date', 'date-time'].includes(property.format!)) {
      return 'datetime'
    }
  }

  if( 'type' in property ) {
    return property.type
  }
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
    const resultEither = await validate(property, what[propName], options)

    if( isLeft(resultEither) ) {
      return unwrapEither(resultEither)
    }
  }

  if( 'enum' in property && property.enum?.length === 0 ) {
    return
  }

  if( actualType !== expectedType && !('items' in property && actualType === 'array') ) {
    if( expectedType === 'datetime' && value instanceof Date ) {
      return
    }

    return makePropertyError('unmatching', {
      expected: expectedType,
      got: actualType
    })
  }

  if( 'type' in property && property.type === 'number' ) {
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

  else if( 'enum' in property ) {
    if( !property.enum.includes(value) ) {
      return makePropertyError('extraneous_element', {
        expected: property.enum,
        got: value
      })
    }
  }

  else if( 'items' in property ) {
    for( const elem of value ) {
      const result = await validateProperty(propName, elem, property.items, options) as PropertyValidationError | undefined

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
    const property = description.properties[propName as any]
    if( ('type' in property && property.type === 'boolean') || property.readOnly ) {
      continue
    }

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
  const TDescription extends Omit<Description, '$id' | 'items'>
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

export const validateSilently = async <
  TWhat extends Record<Lowercase<string>, any>,
  const TDescription extends Omit<Description, '$id'>
>(
  what: TWhat | undefined,
  description: TDescription,
  options: ValidateOptions = {}
) => {
  const result = await validate(what, description, options)
  return isLeft(result)
    ? null
    : result.value
}

export const validator = <const TDescription extends Omit<Description, '$id'>>(
  description: TDescription,
  options: ValidateOptions = {}
) => {

  return <const>[
    {} as Schema<TDescription>,
    async <TWhat extends Record<Lowercase<string>, any>>(what: TWhat) => {
      return validateSilently(what, description, options)
    }
  ]
}

