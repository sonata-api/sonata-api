import type { init } from '@sonata-api/server'

const main = async () => {
  const entrypoint: ReturnType<typeof init> = require(process.argv[1]).default
  entrypoint.listen()
}

main()

