import { writeFile } from 'fs/promises'
import path from 'path'

const DTS_FILENAME = 'sonata-api.d.ts'

const dts = `// this file will be overwritten
import type { AssetType, ResourceErrors, Schema } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import type { Either } from '@sonata-api/common'

declare global {
  type SystemCollections = typeof import('@sonata-api/system/collections')
  type UserCollections = typeof import('./src').collections

  type Collections = {
    [K in keyof (SystemCollections & UserCollections)]: ReturnType<(SystemCollections & UserCollections)[K]>
  }
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
