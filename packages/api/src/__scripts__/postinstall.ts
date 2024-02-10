import { writeFile } from 'fs/promises'
import path from 'path'

const DTS_FILENAME = 'sonata-api.d.ts'

const dts = `// this file will be overwritten
import type {} from '@sonata-api/types'

declare global {
  type Collections = typeof import('./src').default extends infer Entrypoint
    ? 'options' extends keyof Entrypoint
      ? 'collections' extends keyof Entrypoint['options']
        ? Entrypoint['options']['collections'] extends infer UserCollections
          ? {
            [P in keyof UserCollections]: UserCollections[P] extends infer Candidate
              ? Candidate extends (...args: any[]) => infer Coll
                ? Coll
                : Candidate
              : never
          }
          : never
        : never
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
