import type { Description } from '@sonata-api/types'
import { checkForUndefined, evaluateCondition } from '.'

export const getMissingProperties = (
  what: Record<Lowercase<string>, any>,
  description: Omit<Description, '$id'>,
  required: Description['required']
) => {
  const missingProps: string[] = []

  if( Array.isArray(required) ) {
    for( const propName of required ) {
      const isMissing = checkForUndefined(
        description.properties[propName as keyof typeof description.properties],
        propName as Lowercase<string>,
        what
      )

      if( isMissing ) {
        missingProps.push(propName as string)
      }
    }
  }

  else for( const propName in required ) {
    const requiredProp = required[propName]
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
      missingProps.push(propName)
    }
  }

  return missingProps
}

