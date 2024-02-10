import type { ObjectId } from '@sonata-api/types'
import { getConfig } from '@sonata-api/entrypoint'
import bcrypt from 'bcrypt'

export const getActivationLink = async (userId: ObjectId) => {
  const config = await getConfig()

  const activationToken = await bcrypt.hash(userId.toString(), 10)
  const link = `${config.apiUrl}/user/activate?u=${userId.toString()}&t=${activationToken}`

  return link
}

