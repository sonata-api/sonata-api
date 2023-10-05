import type { Context, ResourceType } from '@sonata-api/api'
import type { MatchedRequest } from '@sonata-api/http'
import { useFunctions } from '@sonata-api/api'

type PostHookParams = {
  redirected?: boolean
  result: any
  request: MatchedRequest
  context: Context
  resourceName: string
  resourceType: ResourceType
}

export const appendPagination = async (params: PostHookParams) => {
  const {
    context,
    request,
    result,
    resourceType
  } = params

  if( Array.isArray(result) && resourceType === 'collection' ) {
    const { count } = useFunctions()()
    const recordsTotal = await count(request.req.payload, context)

    const limit = request.req.payload.limit
      ? request.req.payload.limit
      : Number(process.env.PAGINATION_LIMIT || 35)

    return {
      data: result,
      pagination: {
        recordsCount: result.length,
        recordsTotal,
        offset: request.req.payload.offset || 0,
        limit
      }
    }
  }

  return result
}

