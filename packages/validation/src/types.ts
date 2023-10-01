export enum ValidationErrorCodes {
  EmptyTarget = 'EMPTY_TARGET',
  MissingProperties = 'MISSING_PROPERTIES',
  InvalidProperties = 'INVALID_PROPERTIES'
}

export type ValidateOptions = {
  extraneous?: Array<string>|boolean
  throwOnError?: boolean
  recurse?: boolean
}


export type PropertyValidationErrorType = 'extraneous'
  | 'unmatching'
  | 'extraneous_element'
  | 'numeric_constraint'

export type PropertyValidationError = {
  type: PropertyValidationErrorType
  details: {
    expected: string | ReadonlyArray<any>
    got: string
  }
}

export type ValidationError = {
  code: ValidationErrorCodes
  errors?: Record<string, PropertyValidationError | ValidationError> | {} 
  missing?: string[]
}
