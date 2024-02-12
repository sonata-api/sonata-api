import type { init } from '@sonata-api/server'

const main = async () => {
  const entrypoint: ReturnType<typeof init> = (await (new Function('return import(process.argv[1])'))()).default
  entrypoint.listen()
}

main()

