import type { init } from '@sonata-api/server'

const dynamicImport = async () => {
  const fn = new Function('return import(process.argv[1])')
  return (await fn()).default
}

const main = async () => {
  const entrypoint: ReturnType<typeof init> = await dynamicImport()
  entrypoint.listen()
}

main()

