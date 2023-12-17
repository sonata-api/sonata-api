import type { Description } from '@sonata-api/types'
import type { Context } from '@sonata-api/api'
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

const getUser = <TDescription extends Description>(context: Context<TDescription>): Promise<Record<string, any> | null> => {
  return context.models.user.findOne(
    { _id: context.token.user._id },
    { resources_usage: 1 }
  )
}

export const limitRate = async <TDescription extends Description>(
  context: Context<TDescription>,
  params: RateLimitingParams
) => {
  let user: Awaited<ReturnType<typeof getUser>>

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
    const entry = await context.models.resourceUsage.insertOne(<any>{ hits: increment })
    await context.models.user.updateOne(
      { _id: user._id },
      { $set: { [`resources_usage.${context.functionPath}`]: entry.insertedId }
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
