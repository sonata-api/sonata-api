import type { AccessControl, Role } from './types'
import { getEntrypoint } from '@sonata-api/api'
import { deepMerge } from '@sonata-api/common'

let acMemo: AccessControl | null = null

const getAccessControl = async () => {
  if ( !acMemo ) {
    acMemo = (await getEntrypoint()).accessControl
  }

  return acMemo!
}

const applyInheritance = async (accessControl: AccessControl, targetRole: Role) => {
  const role = Object.assign({}, targetRole) as typeof targetRole & {
    inherit?: Array<keyof typeof accessControl['roles']>
  }

  if( role.inherit ) {
    for( const roleName of role.inherit ) {
      const parentRole = accessControl.roles?.[roleName]
      if( !parentRole ) {
        throw new Error(`inherit: role ${roleName} doesnt exist`)
      }

      Object.assign(role, deepMerge(role, await applyInheritance(accessControl, parentRole)))
    }
  }

  return role
}

export const isGranted = async <
  const ResourceName extends string,
  const FunctionName extends string,
  const ACProfile extends {
    roles?: Array<string>
    allowedFunctions?: Array<string>
  }
>(
  resourceName: ResourceName,
  functionName: FunctionName,
  acProfile: ACProfile
) => {
  const accessControl = await getAccessControl()
  const userRoles = (acProfile.roles || ['guest']) as Array<keyof typeof accessControl['roles']>

  for( const roleName of userRoles ) {
    const _currentRole = accessControl.roles?.[roleName]
    if( !_currentRole ) {
      throw new Error(`role ${roleName} doesnt exist`)
    }

    const currentRole = await applyInheritance(accessControl, _currentRole)
    const subject = currentRole?.capabilities?.[resourceName]
    if( subject?.blacklist?.includes(functionName) ) {
      return false
    }

    const allowedInToken = !acProfile.allowedFunctions || (
      acProfile.allowedFunctions.includes(`${resourceName}@${functionName}`)
    )

    const result = allowedInToken
      && (!currentRole.forbidEverything || subject?.functions?.includes(functionName))
      && (
        currentRole?.grantEverything
        || subject?.grantEverything
        || subject?.functions?.includes(functionName)
      )

    if( result ) {
      return true
    }

    return false
  }
}

export const grantedFor = async <
  const ResourceName extends string,
  const FunctionName extends string
>(
  resourceName: ResourceName,
  functionName: FunctionName
) => {
  const accessControl = await getAccessControl()

  if( !accessControl.roles ) {
    return []
  }

  const roles = []
  for( const role in accessControl.roles ) {
    const granted = await isGranted(resourceName, functionName, {
      roles: [
        role
      ]
    })

    if( granted ) {
      roles.push(role)
    }
  }

  return roles
}
