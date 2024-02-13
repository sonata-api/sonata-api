import type { init } from '@sonata-api/server'
import { dynamicImport } from '@sonata-api/common'

const main = async () => {
  const entrypoint: {
    default: ReturnType<typeof init>
  } = await dynamicImport(process.argv[1])

  entrypoint.default.listen()
}

main()

