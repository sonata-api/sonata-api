import type { Context } from '@sonata-api/api'
import { useFunctions } from '@sonata-api/api'

type PostHookParams = {
  redirected?: boolean
  result: any
  context: Context
}

export const appendPagination = async (params: PostHookParams) => {
  const {
    context,
    result,
  } = params

  if( Array.isArray(result) ) {
    const { count } = useFunctions()()
    const recordsTotal = await count(context.request.payload, context)

    const limit = context.request.payload.limit
      ? context.request.payload.limit
      : Number(process.env.PAGINATION_LIMIT || 35)

    return {
      data: result,
      pagination: {
        recordsCount: result.length,
        recordsTotal,
        offset: context.request.payload.offset || 0,
        limit
      }
    }
  }

  return result
}

