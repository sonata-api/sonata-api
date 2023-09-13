import type { Request } from '@hapi/hapi'
import type { Context, ResourceType } from '@sonata-api/api'
import type { HandlerRequest, } from '../types'
import { getResourceAsset } from '@sonata-api/api'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'

type PostHookParams = {
  redirected?: boolean
  result: any
  request: Request & HandlerRequest
  context: Context<any, any, any>
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

    const countPayload = await accessControl.beforeRead(request.payload)
    const recordsTotal = await model.countDocuments(countPayload)

    const limit = request.payload?.limit
      ? request.payload.limit
      : Number(process.env.PAGINATION_LIMIT || 35)

      Object.assign(response, {
        pagination: {
          recordsCount: result.length,
          recordsTotal,
          offset: request.payload?.offset || 0,
          limit
        }
      })
  }

  return response
}

