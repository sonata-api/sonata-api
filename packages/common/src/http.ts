export type RequestParams = Parameters<typeof fetch>[1]

export const request = async <Return=any>(
  url: string,
  payload?: any,
  params: RequestParams & { headers: Record<string, string> } = {
    method: payload
      ? 'POST'
      : 'GET',
    headers: {
      ...(payload
        ? { 'content-type': 'application/json' }
        : {})
    },
  },
  transformer = async (response: Awaited<ReturnType<typeof fetch>>) => {
    const result = response as Awaited<ReturnType<typeof fetch>> & {
      data: Return
    }

    result.data = await response.text() as Return

    if( response.headers.get('content-type')?.startsWith('application/json') ) {
      const data = result.data = JSON.parse(result.data as string) as Return & {
        error?: any
      }

      if( data.error ) {
        const error = new Error(data.error.message)
        Object.assign(error, data.error)
        throw error
      }
    }

    return result
  }
) => {
  params.body = payload
  if( globalThis.userStorage ) {
    const token = globalThis.userStorage.getItem('auth:token')
    if( token ) {
      params.headers['authorization'] ??= `Bearer ${token}`
    }
  }

  if( params.headers?.['content-type']?.startsWith('application/json') ) {
    params.body = JSON.stringify(payload)
  }

  const response = await fetch(url, params)
  return transformer(response)
}
