import type { init } from '@sonata-api/server'

const dynamicImport = async () => {
  const fn = new Function('return import(process.argv[1])')
  const m = await fn()

  return m.default.default
    ? m.default.default
    : m.default
}

const main = async () => {
  const entrypoint: ReturnType<typeof init> = await dynamicImport()

  entrypoint.listen()
}

main()

