import http from 'node:http'
import {
  type ServerOptions,
  type GenericRequest,
  type GenericResponse

} from '@sonata-api/http'

const getBody = ($req: http.IncomingMessage) => {
  return new Promise<string>((resolve) => {
    const bodyParts: Buffer[] = []
    let body

    $req.on('data', (chunk) => {
      bodyParts.push(chunk)
    })

    $req.on('end', () => {
      body = Buffer.concat(bodyParts).toString()
      resolve(body)
    })
  })
}

export const abstractRequest = async (request: http.IncomingMessage) => {
  const req: GenericRequest = {
    url: request.url || '',
    method: request.method || '',
    headers: request.headers || {},
    body: await getBody(request),
    payload: {}
  }

  return req
}

export const abstractResponse = (response: http.ServerResponse): GenericResponse => {
  const { end } = response

  return Object.assign(response, {
    writeHead: response.writeHead.bind(response),
    setHeader: response.setHeader.bind(response),
    end: (value) => {
      if( value?.constructor === Object ) {
        response.setHeader('content-type', 'application/json')
        return end.bind(response)(JSON.parse(value))
      }

      return end.bind(response)(value)
    }
  } as GenericResponse)
}

const abstractTransaction = async ($req: http.IncomingMessage, $res: http.ServerResponse) => {
  const req = await abstractRequest($req)
  const res = abstractResponse($res)

  return {
    req,
    res
  }
}

export const registerServer = (options: ServerOptions, cb: (req: GenericRequest, res: GenericResponse) => void|Promise<void>) => {
  const server = http.createServer(async ($req, $res) => {
    const {
      req,
      res
    } = await abstractTransaction($req, $res)

    cb(req, res)
  })

  return {
    server,
    listen: () => server.listen(options.port, options.host)
  }
}

