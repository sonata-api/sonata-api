import type { Context } from '@sonata-api/api'
import { PAGINATION_PER_PAGE_LIMIT } from '@sonata-api/types'

type PreHookParams = {
  context: Context
}

export const sanitizeRequest = async (params: PreHookParams) => {
  const { request } = params.context
  if( ['POST', 'PUT'].includes(request.method) ) {
    if( !request.payload ) {
      throw new Error('request payload absent')
    }
  }

  return params
}

export const prependPagination = async (params: PreHookParams) => {
  const { request } = params.context
  if(
    typeof request.payload.limit === 'number'
    && request.payload.limit > PAGINATION_PER_PAGE_LIMIT
  ) {
    request.payload.limit = PAGINATION_PER_PAGE_LIMIT
  }

  return params
}

