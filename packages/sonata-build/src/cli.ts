import { parseArgs } from 'node:util'
import { bundle } from './bundle.js'
import { compile } from './compile.js'
import { watch } from './watch.js'
import { migrate } from './migrate.js'
import { pipeline } from './pipeline.js'

const { values: opts } = parseArgs({
  options: {
    watch: {
      type: 'boolean',
      short: 'w',
    },
    mode: {
      type: 'string',
      short: 'm',
    },
    migrate: {
      type: 'boolean',
      short: 'M',
    },
  },
})

const mode = () => {
  if( opts.watch ) {
    return 'watch'
  }

  if( opts.migrate ) {
    return 'migrate'
  }

  return opts.mode || 'pipeline'
}

async function main() {
  switch( mode() ) {
    case 'compile':
      return compile()
    case 'bundle':
      return bundle()
    case 'pipeline':
      return pipeline()
    case 'watch':
      return watch()
    case 'migrate':
      return migrate()

    default:
      throw new Error(`mode ${mode} not found`)
  }
}

main()

