import type { Context } from '@sonata-api/types'
import { useFunctions } from '@sonata-api/api'

export const appendPagination = async (result: any, context: Context) => {
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

