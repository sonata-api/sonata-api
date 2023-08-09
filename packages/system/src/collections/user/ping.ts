import type { Context } from '@sonata-api/api'
import { left } from '@sonata-api/common'

const ping = async (_props: null, { token }: Context) => {
  if( !token.user?.roles?.length ) {
    return left('AUTHORIZATION_ERROR')
  }
}

export default ping
