import { writeFile } from 'fs/promises'
import path from 'path'

const DTS_FILENAME = 'sonata-api.d.ts'

const dts = `// this file will be overwritten
import type {} from '@sonata-api/types'

declare global {
  type Collections = Awaited<typeof import('.').default> extends infer Entrypoint
    ? Entrypoint.options.collections extends infer UserCollections
      ? {
        [K in keyof UserCollections]: UserCollections[K] extends infer CollCandidate
          ? CollCandidate extends () => infer Coll
            ? Coll
            : CollCandidate
          : never
      }
      : never
    : never
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
