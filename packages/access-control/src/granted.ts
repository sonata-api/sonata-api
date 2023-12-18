import type { AccessControl, Role, ACProfile } from '@sonata-api/types'
import { getCollection, getCollections } from '@sonata-api/entrypoint'
import { deepMerge } from '@sonata-api/common'
import { DEFAULT_ACCESS_CONTROL } from './constants'

let availableRolesMemo: string[]

const applyInheritance = async (accessControl: AccessControl, targetRole: Role) => {
  const role = Object.assign({}, targetRole) as typeof targetRole & {
    inherit?: (keyof typeof accessControl['roles'])[]
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

export const getAccessControl = async <TCollectionName extends string>(collectionName: TCollectionName): Promise<AccessControl> => {
  const collection = await getCollection(collectionName)
  const accessControl = collection.accessControl || DEFAULT_ACCESS_CONTROL
  
  return accessControl
}

export const getAvailableRoles = async () => {
  if( availableRolesMemo ) {
    return availableRolesMemo
  }

  const collections = await getCollections()
  const availableRoles = []

  for( const collectionName in collections ) {
    const ac = await getAccessControl(collectionName)
    if( !ac.roles ) {
      continue
    }

    availableRoles.push(...Object.keys(ac.roles))
  }

  availableRolesMemo = [ ...new Set(availableRoles) ]
  return availableRolesMemo
}

export const isGranted = async (
  collectionName: keyof Collections,
  functionName: string,
  acProfile: ACProfile
) => {
  const accessControl = await getAccessControl(collectionName)
  const userRoles = (acProfile.roles || ['guest'])

  for( const roleName of userRoles ) {
    const _currentRole = accessControl.roles?.[roleName]
    if( !_currentRole ) {
      continue
    }

    const currentRole = await applyInheritance(accessControl, _currentRole)
    if( currentRole.forbid?.includes(functionName) ) {
      return false
    }

    const allowedInToken = !acProfile.allowed_functions || (
      acProfile.allowed_functions.includes(`${collectionName}@${functionName}`)
    )

    const result = allowedInToken && (
      currentRole.grantEverything
      || currentRole.grant?.includes(functionName)
    )

    if( result ) {
      return true
    }
  }

  return false
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
