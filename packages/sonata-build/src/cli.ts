import { parseArgs } from 'node:util'
import { build } from './build'
import { compile } from './compile'
import { watch } from './watch'
import pipeline from './pipeline'

const { values: opts } = parseArgs({
  options: {
    watch: {
      type: 'boolean',
      short: 'w'
    },
    mode: {
      type: 'string',
      short: 'm',
    },
  },
})

async function main() {
  const mode = opts.mode
    ? opts.mode
    : opts.watch
      ? 'watch'
      : 'pipeline'

  switch( mode ) {
    case 'compile':
      return compile()
    case 'build':
      return build()

    case 'pipeline':
      return pipeline()

    case 'watch':
      return watch()

    default:
      throw new Error(`mode ${mode} not found`)
  }
}

main()
