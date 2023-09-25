import type { DecodedToken, Context } from '@sonata-api/api'
import type { MatchedRequest, GenericResponse } from '@sonata-api/http'
import { PAGINATION_PER_PAGE_LIMIT } from '@sonata-api/types'

type PreHookParams = {
  request: MatchedRequest
  token: DecodedToken
  response: GenericResponse
  context: Context<any, any, any>
}

export const sanitizeRequest = async (params: PreHookParams) => {
  const { request } = params
  if( ['POST', 'PUT'].includes(request.req.method) ) {
    if( !request.req.payload ) {
      throw new Error('request payload absent')
    }
  }

  return params
}

export const prependPagination = async (params: PreHookParams) => {
  const { request } = params
  if(
    typeof request.req.payload.limit === 'number'
    && request.req.payload.limit > PAGINATION_PER_PAGE_LIMIT
  ) {
    request.req.payload.limit = PAGINATION_PER_PAGE_LIMIT
  }

  return params
}

