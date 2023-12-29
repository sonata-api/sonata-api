import glob from 'glob'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { log } from './log'

import { build } from './modes'
import { compile } from './compile'
import { extractIcons, iconsContent, iconsDtsContent } from '@sonata-api/system'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'

const DATA_PATH = '.sonata'

const phases = [
  compilationPhase,
  buildPhase
]

async function compilationPhase() {
  const fileList = glob.sync('**/*.ts', {
    ignore: [
      'node_modules/**/*.ts'
    ]
  })
  const result = await compile(fileList)

  if( !result.success ) {
    return left(`typescript compilation produced ${result.diagnostics!.length} errors, please fix them`)
  }

  const collections = require(path.join(process.cwd(), 'dist', 'collections'))
  const base = path.join(process.cwd(), 'node_modules', DATA_PATH)
  const icons = []

  await mkdir(base, { recursive: true })

  for( const collectionName in collections ) {
    const candidate = collections[collectionName]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    icons.push(...extractIcons(collection.description))
  }

  const uniqueIcons = [ ...new Set(icons) ]
  await writeFile(path.join(base, 'icons.js'), iconsContent(uniqueIcons))
  await writeFile(path.join(base, 'icons.d.ts'), iconsDtsContent(uniqueIcons))

  return right('compilation went without errors')
}

async function buildPhase() {
  const buildSucceded = await build()
  return right('build went without errors')
}

export default function pipeline() {
  return phases.reduce(async (a: any, phase) => {
    if( !a ) {
      return
    }

    const resultEither = await phase()
    if( isLeft(resultEither) ) {
      log('error', unwrapEither(resultEither))
      return
    }

    const result = unwrapEither(resultEither)
    log('info', result)
    return true
  }, true)
}
