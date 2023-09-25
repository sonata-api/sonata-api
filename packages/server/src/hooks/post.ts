import type { Context, ResourceType } from '@sonata-api/api'
import type { MatchedRequest } from '@sonata-api/http'
import { getResourceAsset } from '@sonata-api/api'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'

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
    resourceName,
    resourceType
  } = params

  if( result?.constructor?.name === 'Response' ) {
    return result
  }

  const response = result?._tag
    ? result
    : { result }

  if( Array.isArray(result) && resourceType === 'collection' ) {
    const model = unsafe(await getResourceAsset(resourceName, 'model'))
    const accessControl = useAccessControl(context)

    const countPayload = unsafe(await accessControl.beforeRead(request.req.payload))
    const recordsTotal = await model.countDocuments(countPayload.filters)

    const limit = request.req.payload.limit
      ? request.req.payload.limit
      : Number(process.env.PAGINATION_LIMIT || 35)

      Object.assign(response, {
        pagination: {
          recordsCount: result.length,
          recordsTotal,
          offset: request.req.payload.offset || 0,
          limit
        }
      })
  }

  return response
}

