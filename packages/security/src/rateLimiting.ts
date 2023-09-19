import type { Description } from '@sonata-api/types'
import type { Context, Collections, Algorithms } from '@sonata-api/api'
import type { User } from '@sonata-api/system'
import { left, right } from '@sonata-api/common'

export type RateLimitingParams = {
  limit?: number
  scale?: number
  increment?: number
}

export enum RateLimitingErrors {
  Unauthenticated = 'UNAUTHENTICATED',
  LimitReached = 'LIMIT_REACHED'
}

const getUser = (context: Context<any, Collections, Algorithms>) => {
  return context.models.user.findOne(
    { _id: context.token.user._id },
    { resources_usage: 1 }
  ) as Promise<User>
}

export const limitRate = async <const T extends Description>(
  context: Context<T, Collections, Algorithms>,
  params: RateLimitingParams
) => {
  let user: Awaited<ReturnType<typeof getUser>> | undefined

  if( !context.token.user?._id || !(user = await getUser(context)) ) {
    return left(RateLimitingErrors.Unauthenticated)
  }

  const {
    increment = 1,
    limit,
    scale
  } = params

  const payload = {
    $inc: {
      hits: increment
    },
    $set: {}
  }

  const usage = user.resources_usage?.get(context.functionPath)
  if( !usage ) {
    const entry = await context.models.resourceUsage.create({ hits: increment })
    await context.models.User.updateOne(
      { _id: user._id },
      { $set: { [`resources_usage.${context.functionPath}`]: entry._id }
      }
    )

    return right(null)
  }

  if( scale && (new Date().getTime()/1000 - usage.updated_at!.getTime()/1000 < scale) ) {
    return left(RateLimitingErrors.LimitReached)
  }

  if( limit && (usage.hits! % limit === 0) ) {
    payload.$set = {
      last_maximum_reach: new Date()
    }
  }

  await context.models.resourceUsage.updateOne(
    { _id: usage._id },
    payload
  )

  return right(null)
}
