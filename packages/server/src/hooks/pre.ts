import type { ResponseToolkit } from '@hapi/hapi'
import type { DecodedToken, Context } from '@sonata-api/api'
import type { HandlerRequest } from '../types'
import { PAGINATION_PER_PAGE_LIMIT } from '@sonata-api/types'

type PreHookParams = {
  request: HandlerRequest
  token: DecodedToken
  response: ResponseToolkit
  context: Context<any, any, any>
}

export const sanitizeRequest = async (params: PreHookParams) => {
  const { request } = params
  if( ['POST', 'PUT'].includes(request.method) ) {
    if( !request.payload ) {
      throw new Error('request payload absent')
    }
  }

  return params
}

export const prependPagination = async (params: PreHookParams) => {
  const { request } = params
  if(
    typeof request.payload?.limit === 'number'
    && request.payload.limit > PAGINATION_PER_PAGE_LIMIT
  ) {
    request.payload.limit = PAGINATION_PER_PAGE_LIMIT
  }

  return params
}

