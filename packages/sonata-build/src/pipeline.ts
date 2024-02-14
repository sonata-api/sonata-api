import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { extractIcons, iconsEsmContent, iconsCjsContent, iconsDtsContent } from './icons'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'
import { log } from './log.js'
import { bundle } from './bundle.js'
import { compile } from './compile.js'
import { migrate } from './migrate.js'

const DATA_PATH = '.sonata'

const phases = [
  compilationPhase,
  migrate,
  bundle,
]

async function compilationPhase() {
  const result = await compile()

  if( !result.success ) {
    return left(`typescript compilation produced ${result.diagnostics.length} errors, please fix them`)
  }

  const collections = require(path.join(process.cwd(), 'dist', 'collections'))
  const base = path.join(process.cwd(), 'node_modules', DATA_PATH)
  const icons = []

  await mkdir(base, {
    recursive: true,
  })

  for( const collectionName in collections ) {
    const candidate = collections[collectionName]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    icons.push(...extractIcons(collection.description))
  }

  const uniqueIcons = [...new Set(icons)]
  await writeFile(path.join(base, 'icons.mjs'), iconsEsmContent(uniqueIcons))
  await writeFile(path.join(base, 'icons.cjs'), iconsCjsContent(uniqueIcons))
  await writeFile(path.join(base, 'icons.d.ts'), iconsDtsContent(uniqueIcons))

  return right('compilation succeeded')
}

export const pipeline = () => {
  return phases.reduce(async (a: any, phase) => {
    if( !await a ) {
      return
    }

    const resultEither = await phase()
    if( isLeft(resultEither) ) {
      log('error', unwrapEither(resultEither))
      log('info', 'pipeline aborted')
      return
    }

    const result = unwrapEither(resultEither)
    log('info', result)
    return true
  }, true)
}

