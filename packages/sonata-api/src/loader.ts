import type { init } from '@sonata-api/server'
import { dynamicImport } from '@sonata-api/common'

const main = async () => {
  const entrypoint = await dynamicImport(process.argv[1])
  const entrypointMain: ReturnType<typeof init> = entrypoint.default
    ? entrypoint.default
    : entrypoint

  entrypointMain.listen()
}

main()

