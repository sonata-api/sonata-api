import { getConfig } from '@sonata-api/entrypoint'
import { createContext } from './context.js'
import { getDatabase } from './database.js'

export const useAeria = async () => {
  await getDatabase()

  const context = await createContext({
    config: await getConfig(),
    token: {
      authenticated: false,
      sub: null,
    },
  })

  return context
}

