import type { Description } from '@sonata-api/types'
import type { Context } from './context'
import { mongoose } from './database'
import { left } from '@sonata-api/common'

export type RateLimitingParams = {
  limit?: number
  scale?: number
  increment?: number
}

export const limitRate = async <const T extends Description>(context: Context<T, Collections, Algorithms>, params: RateLimitingParams) => {
  const UserModel = mongoose.models.user
  const ResourceUsageModel = mongoose.models.resourceUsage

  const user = await UserModel.findOne(
    { _id: context.token?.user._id },
    { resources_usage: 1 }
  )

  if( !user ) {
    return left({
      error: 'No user found',
      httpCode: 429
    })
  }

  const increment = params.increment || 1
  const payload = {
    $inc: {
      hits: increment
    },
    $set: {}
  }

  const usage = user.resources_usage?.get(context.functionPath)
  if( !usage ) {
    const entry = await ResourceUsageModel.create({ hits: increment })
    return UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          [`resources_usage.${context.functionPath}`]: entry._id
        }
      }
    )
  }

  if( params.scale && (new Date().getTime()/1000 - usage.updated_at.getTime()/1000 < params.scale) ) {
    return left({
      error: 'limit reached',
      httpCode: 429
    })
  }

  if( params.limit && (usage.hits % params.limit === 0) ) {
    payload.$set = {
      last_maximum_reach: new Date()
    }
  }

  return ResourceUsageModel.updateOne(
    { _id: usage._id },
    payload
  )
}
