import type { Context, PackReferences } from '@sonata-api/types'
import * as bcrypt from 'bcrypt'
import { functions } from '@sonata-api/api'
import { type description, type User } from './description'

type Props = {
  what: Omit<PackReferences<User>, 'roles'>
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

  return functions.insert(props, context)
}

export default insert
