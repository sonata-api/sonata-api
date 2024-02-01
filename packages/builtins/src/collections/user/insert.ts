import type { Context, PackReferences } from '@sonata-api/types'
import type { user } from '.'
import * as bcrypt from 'bcrypt'
import { functions } from '@sonata-api/api'

type Props = {
  what: Omit<PackReferences<typeof user.item>, 'roles'>
}

export const insert = async (props: Props, context: Context) => {
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

