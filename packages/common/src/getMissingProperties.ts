import type { Description } from '@sonata-api/types'
import { checkForUndefined, evaluateCondition } from '.'

export const getMissingProperties = (
  what: Record<Lowercase<string>, any>,
  description: Omit<Description, '$id'>,
  required: Description['required']
) => {
  const missingProps: Lowercase<string>[] = []

  if( Array.isArray(required) ) {
    for( const propName of (required as Lowercase<string>[]) ) {
      const isMissing = checkForUndefined(
        description.properties[propName as keyof typeof description.properties],
        propName,
        what
      )

      if( isMissing ) {
        missingProps.push(propName)
      }
    }
  }

  else for( const propName in required ) {
    const requiredProp = required[propName as any]
    if( typeof requiredProp === 'boolean' ) {
      if( !requiredProp ) {
        continue
      }
    }

    if( typeof requiredProp === 'object' ) {
      const result = evaluateCondition(what, requiredProp)
      if( !result.satisfied ) {
        continue
      }
    }

    const isMissing = checkForUndefined(
      description.properties[propName as keyof typeof description.properties],
      propName as Lowercase<string>,
      what
    )

    if( isMissing ) {
      missingProps.push(propName as Lowercase<string>)
    }
  }

  return missingProps
}

