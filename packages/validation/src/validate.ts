import type { JsonSchema, Property, Schema } from '@sonata-api/types'
import { isLeft, left, right, unwrapEither, getMissingProperties } from '@sonata-api/common'
import {
  ValidationErrorCodes,
  PropertyValidationErrorType,
  PropertyValidationError,
  ValidationError

} from '@sonata-api/types'

export type ValidateOptions = {
  extraneous?: string[] | boolean
  throwOnError?: boolean
}

const getValueType = (value: any) => {
  return Array.isArray(value)
    ? 'array'
    : typeof value
}

const getPropertyType = (property: Property) => {
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

export const validateProperty = (
  propName: Lowercase<string>,
  what: any,
  property: Property,
  options: ValidateOptions = {}
) => {
  const { extraneous } = options
  if( what === undefined ) {
    return
  }

  if( (Array.isArray(extraneous) && extraneous.includes(propName)) || !property ) {
    return makePropertyError('extraneous', {
      expected: 'undefined',
      got: getValueType(what)
    })
  }

  if( 'properties' in property ) {
    const resultEither = validate(what, property, options)

    return isLeft(resultEither)
      ? unwrapEither(resultEither)
      : undefined
  }

  if( 'literal' in property ) {
    if( what !== property.literal ) {
      return makePropertyError('unmatching', {
        expected: property.literal,
        got: what
      })
    }

    return
  }

  const expectedType = getPropertyType(property)!
  const actualType = getValueType(what)

  if( 'enum' in property && property.enum?.length === 0 ) {
    return
  }

  if( actualType !== expectedType && !('items' in property && actualType === 'array') ) {
    if( expectedType === 'datetime' && what instanceof Date ) {
      return
    }

    if( expectedType === 'boolean' && !what )  {
      return
    }

    return makePropertyError('unmatching', {
      expected: expectedType,
      got: actualType
    })
  }

  if( 'type' in property && property.type === 'number' ) {
    if(
      (property.maximum && property.maximum < what)
    || (property.minimum && property.minimum > what)
    || (property.exclusiveMaximum && property.exclusiveMaximum <= what)
    || (property.exclusiveMinimum && property.exclusiveMinimum >= what)
    ) {
      return makePropertyError('numeric_constraint', {
        expected: 'number',
        got: 'invalid_number'
      })
    }
  }

  else if( 'enum' in property ) {
    if( !property.enum.includes(what) ) {
      return makePropertyError('extraneous_element', {
        expected: property.enum,
        got: what
      })
    }
  }

  else if( 'items' in property ) {
    let i = 0
    for( const elem of what ) {
      const result = validateProperty(propName, elem, property.items, options) as PropertyValidationError | undefined

      if( result ) {
        result.index = i
        return result
      }

      i++
    }
  }

  else if( property.getter ) {
    return makePropertyError('unmatching', {
      expected: 'getters are read-only',
      got: actualType
    })
  }
}

export const validateWholeness = (what: Record<Lowercase<string>, any>, schema: Omit<JsonSchema, '$id'>) => {
  const required = schema.required
    ? schema.required
    : Object.keys(schema.properties)

  const missingProps = getMissingProperties(what, schema, required)

  if( missingProps.length > 0 ) {
    const requiredNames = Array.isArray(required)
      ? required
      : Object.keys(required)

    return makeValidationError({
      code: ValidationErrorCodes.MissingProperties,
      errors: Object.fromEntries(
        requiredNames
          .filter((prop) => !Object.keys(what).includes(prop as string))
          .map((error) => [error, { type: 'missing' }])
    )})
  }

}

export const validate = <
  TWhat extends Record<Lowercase<string>, any>,
  const TJsonSchema extends Omit<JsonSchema, '$id' | 'items'>
>(
  what: TWhat | undefined,
  schema: TJsonSchema,
  options: ValidateOptions = {}
) => {
  if( !what ) {
    return left(makeValidationError({
      code: ValidationErrorCodes.EmptyTarget,
      errors: {}
    }))
  }

  const wholenessError = validateWholeness(what, schema)
  if( wholenessError ) {
    return left(wholenessError)
  }

  const errors: Record<string, PropertyValidationError | ValidationError> = {}

  for( const propName in what ) {
    const result = validateProperty(
      propName as Lowercase<string>,
      what[propName],
      schema.properties?.[propName as Lowercase<string>],
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

  return right(what as Schema<TJsonSchema>)
}

export const validateSilently = <
  TWhat extends Record<Lowercase<string>, any>,
  const TJsonSchema extends Omit<JsonSchema, '$id'>
>(
  what: TWhat | undefined,
  schema: TJsonSchema,
  options: ValidateOptions = {}
) => {
  const result = validate(what, schema, options)
  return isLeft(result)
    ? null
    : result.value
}

export const validator = <const TJsonSchema extends Omit<JsonSchema, '$id'>>(
  schema: TJsonSchema,
  options: ValidateOptions = {}
) => {

  return <const>[
    {} as Schema<TJsonSchema>,
    <TWhat extends Record<Lowercase<string>, any>>(what: TWhat) => {
      return validate(what, schema, options)
    }
  ]
}

export const silentValidator = <const TJsonSchema extends Omit<JsonSchema, '$id'>>(
  schema: TJsonSchema,
  options: ValidateOptions = {}
) => {

  return <const>[
    {} as Schema<TJsonSchema>,
    <TWhat extends Record<Lowercase<string>, any>>(what: TWhat) => {
      return validateSilently(what, schema, options)
    }
  ]
}

