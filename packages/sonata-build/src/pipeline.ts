import glob from 'glob'
import { log } from './log'

import { build } from './modes'
import { compile } from './compile'

async function compilationPhase() {
  const fileList = glob.sync('**/*.ts', {
    ignore: [
      'node_modules/**/*.ts'
    ]
  })
  const result = await compile(fileList)

  if( result.success ) {
    log('success', 'compilation went without errors')
    return buildPhase()
  }

  log('error', `typescript compilation produced ${result.diagnostics!.length} errors, please fix them`)
}

async function buildPhase() {
  const buildSucceded = await build()
  if( true ) {
    log('success', 'build went without errors')
  }
}

export default function pipeline() {
  return compilationPhase()
}
