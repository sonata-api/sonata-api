import type { GenericRequest, GenericResponse } from '@sonata-api/types'

export const cors = (req: GenericRequest, res: GenericResponse) => {
  const headers = <const>{
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': 'Accept,Accept-Version,Authorization,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version',
    'Access-Control-Max-Age': '2592000',
  }

  if( req.method === 'OPTIONS' ) {
    res.writeHead(204, headers)
    res.end()
    return null
  }

  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
}
