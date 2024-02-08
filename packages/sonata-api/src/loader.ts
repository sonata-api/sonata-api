import type { init } from '@sonata-api/server'

const { default: entrypoint } = require(process.cwd())
entrypoint.then((server: Awaited<ReturnType<typeof init>>) => {
  server.listen()
})
