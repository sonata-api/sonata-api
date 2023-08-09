import glob from 'glob'
import { parseArgs } from 'node:util'
import { build } from './modes'
import { compile } from './compile'
import pipeline from './pipeline'

const { values: opts } = parseArgs({
  options: {
    mode: {
      type: 'string',
      short: 'm'
    }
  }
})

async function main() {
  switch( opts.mode ) {
    case 'compile':
      const fileList = glob.sync('**/*.ts', {
        ignore: [
          'node_modules/**/*.ts'
        ]
      })

      return await compile(fileList)
    case 'build':
      return build()

    case 'pipeline':
      return pipeline()

    default:
      throw new Error(
        `mode ${opts.mode} not found`
      )
  }
}

main()
