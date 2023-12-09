import type { WithId } from '@sonata-api/types'
import { type Context, useFunctions } from '@sonata-api/api'
import * as bcrypt from 'bcrypt'
import { description, type User } from './description'

type Props = {
  what: WithId<Partial<User>>
}

const insert = async (props: Props, context: Context<typeof description>) => {
  const { apiConfig } = context
  props.what.group = apiConfig.group

  if( props.what.password ) {
    props.what.password = await bcrypt.hash(props.what.password, 10)
  }

  if( props.what.password === null ) {
    delete props.what.password
  }

  const { insert } = useFunctions<User>()()
  return insert(props, context)
}

export default insert
