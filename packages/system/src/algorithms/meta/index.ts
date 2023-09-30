import { createContext } from '@sonata-api/api'
import describe from './describe'

export const meta = () => ({
  functions: {
    describe,
    async test(_: any, context: any) {
      return context.collections.user.functions.get({
        filters: {},
      }, await createContext({
        resourceName: 'user',
        parentContext: context
      }))
    }
  }
})
