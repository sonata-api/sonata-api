import type { init } from '@sonata-api/server'

const entrypoint: ReturnType<typeof init> = require(process.cwd()).default
entrypoint.listen()
