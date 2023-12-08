export type RequestParams = Omit<Parameters<typeof fetch>[1], 'headers'> & {
  headers?: Partial<Record<string, string>>
}

export type RequestConfig<Return = any> = {
  params?: RequestParams
  requestTransformer?: (...args: Parameters<typeof defaultRequestTransformer>) => Promise<Return>
  responseTransformer?: typeof defaultResponseTransformer
}

export const defaultRequestTransformer = async (url: string, payload: any, params: RequestParams) => {
  const body = params.headers?.['content-type']?.startsWith('application/json')
    ? JSON.stringify(payload)
    : payload

  return {
    url,
    payload,
    params: {
      ...params,
      body
    }
  }
}

export const defaultResponseTransformer = async (response: Awaited<ReturnType<typeof fetch>>) => {
  const result = response as Awaited<ReturnType<typeof fetch>> & {
    data: any
  }

  result.data = await response.text()

  if( response.headers.get('content-type')?.startsWith('application/json') ) {
    const data = result.data = JSON.parse(result.data as string) as {
      error?: any
    }

    if( data.error && data.error instanceof Object ) {
      const error = new Error(data.error.message)
      Object.assign(error, data.error)
      throw error
    }
  }

  return result
}

export const request = async <Return = any>(
  url: string,
  payload?: any,
  config?: RequestConfig<Return>
) => {
  const {
    requestTransformer = defaultRequestTransformer,
    responseTransformer = defaultResponseTransformer,
    params = {
      method: payload
        ? 'POST'
        : 'GET',
      headers: payload
        ? { 'content-type': 'application/json' }
        : {}
    },

  } = config || {} as RequestConfig

  const transformedRequest = await requestTransformer(url, payload, params)

  const response = await fetch(transformedRequest.url, transformedRequest.params)
  return responseTransformer(response)
}

