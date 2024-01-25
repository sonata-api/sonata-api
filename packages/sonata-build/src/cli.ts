import { parseArgs } from 'node:util'
import { bundle } from './bundle'
import { compile } from './compile'
import { watch } from './watch'
import { migrate } from './migrate'
import { pipeline } from './pipeline'

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

