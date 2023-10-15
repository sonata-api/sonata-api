import type { AccessControl, Role } from './types'
import { getCollection } from '@sonata-api/api'
import { deepMerge } from '@sonata-api/common'
import { DEFAULT_ACCESS_CONTROL } from './constants'

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

export const getAccessControl = async <TCollectionName extends string>(collectionName: TCollectionName) => {
  const collection = await getCollection(collectionName)
  const accessControl = collection.accessControl || DEFAULT_ACCESS_CONTROL
  
  return accessControl
}

export const isGranted = async <
  TCollectionName extends string,
  TFunctionName extends string,
  const TACProfile extends {
    roles?: Array<string>
    allowedFunctions?: Array<string>
  }
>(
  collectionName: TCollectionName,
  functionName: TFunctionName,
  acProfile: TACProfile
) => {
  const accessControl = await getAccessControl(collectionName)
  const userRoles = (acProfile.roles || ['guest'])

  for( const roleName of userRoles ) {
    const _currentRole = accessControl.roles?.[roleName]
    if( !_currentRole ) {
      return false
    }

    const currentRole = await applyInheritance(accessControl, _currentRole)
    const subject = currentRole?.capabilities?.[collectionName]
    if( subject?.blacklist?.includes(functionName) ) {
      return false
    }

    const allowedInToken = !acProfile.allowedFunctions || (
      acProfile.allowedFunctions.includes(`${collectionName}@${functionName}`)
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
  TCollectionName extends string,
  TFunctionName extends string
>(
  collectionName: TCollectionName,
  functionName: TFunctionName
) => {
  const accessControl = await getAccessControl(collectionName)
  if( !accessControl.roles ) {
    return []
  }

  const roles = []
  for( const role in accessControl.roles ) {
    const granted = await isGranted(collectionName, functionName, {
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
