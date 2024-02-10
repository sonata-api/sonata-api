import type { Context } from '@sonata-api/types'
import { functions } from '@sonata-api/api'
import { getConfig } from '@sonata-api/entrypoint'

export const appendPagination = async (result: any, context: Context) => {
  if( Array.isArray(result) ) {
    const recordsTotal = await functions.count(context.request.payload, context)

    const config = await getConfig()

    const limit = context.request.payload.limit
      ? context.request.payload.limit
      : config.paginationLimit

    return {
      data: result,
      pagination: {
        recordsCount: result.length,
        recordsTotal,
        offset: context.request.payload.offset || 0,
        limit,
      },
    }
  }

  return result
}

