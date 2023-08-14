import { writeFile } from 'fs/promises'
import path from 'path'

const DTS_FILENAME = 'sonata-api.d.ts'

const dts = `// this file will be overwritten
import type { AssetType, ResourceErrors, Schema, Context as Context_ } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import type { Model } from 'mongoose'
import type { Either } from '@sonata-api/common'

declare global {
  type SystemCollections = typeof import('@sonata-api/system/collections')
  type UserCollections = typeof import('./src').collections

  type SystemAlgorithms = typeof import('@sonata-api/system/algorithms')
  type UserAlgorithms = typeof import('./src').algorithms

  type Collections = {
    [K in keyof (SystemCollections & UserCollections)]: Awaited<ReturnType<(SystemCollections & UserCollections)[K]>>
  }

  type Algorithms = {
    [K in keyof (SystemAlgorithms & UserAlgorithms)]: Awaited<ReturnType<(SystemAlgorithms & UserAlgorithms)[K]>>
  }

  type Context<TDescription extends Description=any>
    = Context_<TDescription, Collections, Algorithms>

  type UserAccessControl = typeof accessControl

  type UserACProfile = {
    roles: ReadonlyArray<keyof UserAccessControl['roles']>
  }
}

declare module '@sonata-api/api' {
  export async function getResourceAsset<
    const ResourceName extends keyof Collections,
    const AssetName extends (keyof Collections[ResourceName] & AssetType) | 'model',
    ReturnedAsset=ResourceName extends keyof Collections
        ? AssetName extends keyof Collections[ResourceName] | 'model'
          ? AssetName extends 'model'
            ? Model<Schema<Collections[ResourceName]['description']>>
            : Collections[ResourceName][AssetName]
          : never
          : never
  >(
    resourceName: ResourceName,
    assetName: AssetName,
  ): Promise<
    Either<
      ResourceErrors,
      ReturnedAsset
    >
  >


  export const get = getResourceAsset

  export async function getFunction<
    ResourceName extends keyof Collections,
    FunctionName extends keyof Collections[ResourceName]['functions'],
    ReturnedFunction=ResourceName extends keyof Collections
        ? FunctionName extends keyof Collections[ResourceName]['functions']
          ? Collections[ResourceName]['functions'][FunctionName]
          : never
          : never
  >(
    resourceName: ResourceName,
    functionName: FunctionName,
    acProfile?: UserACProfile
  ): Promise<
    Either<
      ResourceErrors,
      ReturnedFunction
    >
  >
}
//`

const install = async () => {
  const base = path.join(process.cwd(), '..', '..', '..')

  try {
    // prevent the script from installing the dts on @sonata-api/* packages
    const { name } = require(path.join(base, 'package.json'))
    if( name.startsWith('@sonata-api/') ) {
      return
    }

  } catch( e ) {
    //
  }

  await writeFile(path.join(base, DTS_FILENAME), dts)
}

install()
