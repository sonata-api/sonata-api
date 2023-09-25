import { createContext, getFunction, decodeToken } from '@sonata-api/api'
import { ACErrors } from '@sonata-api/access-control'
import { right, left, isLeft, unwrapEither, unsafe, pipe } from '@sonata-api/common'
import type { MatchedRequest, GenericResponse } from '@sonata-api/http'
import type { DecodedToken, Context, ResourceType, } from '@sonata-api/api'

import { Error as MongooseError } from 'mongoose'
import { sanitizeRequest, prependPagination } from './hooks/pre'
import { appendPagination } from './hooks/post'

export type RegularVerb =
  'get'
  | 'getAll'
  | 'insert'
  | 'remove'
  | 'removeAll'
  | 'upload'

const prePipe = pipe([
  sanitizeRequest,
  prependPagination
])

const postPipe = pipe([
  appendPagination
])

export const getDecodedToken = async (request: MatchedRequest) => {
  try {
    const decodedToken: DecodedToken = request.req.headers.authorization
      ? await decodeToken(request.req.headers.authorization.split('Bearer ').pop() || '')
      : { user: {} }

    return right(decodedToken)
  } catch( e: any ) {
    if( process.env.NODE_ENV === 'development' ) {
      console.trace(e)
    }

    return left('AUTHENTICATION_ERROR')
  }
}

export const safeHandle = (
  fn: (request: MatchedRequest, res: GenericResponse, context: Context) => Promise<object>,
  context: Context
) => async (request: MatchedRequest, res: GenericResponse) => {
  try {
    const response = await fn(request, res, context)
    if( !response ) {
      throw new Error('empty response')
    }

    return response

  } catch(error: any) {
    if( context.apiConfig.errorHandler ) {
      return context.apiConfig.errorHandler(error)
    }

    if( process.env.NODE_ENV !== 'production' ) {
      console.trace(error)
    }

    const response: { error: any, validation?: any } = {
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
        details: error.details,
        silent: error.silent,
        logout: error.logout,
        httpCode: error.httpCode
      }
    }

    if( error instanceof MongooseError.ValidationError ) {
      const errors = Object.values(error.errors)
      response.error.validation = errors.reduce((a, error: any) => {
        return {
          ...a,
          [error.path]: {
            type: error.kind,
            detail: null
          },
        }
      }, {})
    }

    if( request.req.headers['sec-fetch-mode'] === 'cors' ) {
      return response
    }

    error.httpCode ??= 500
    res.writeHead(error.httpCode)
    res.end(response)
  }
}

export const customVerbs = (resourceType: ResourceType) => async (
  request: MatchedRequest,
  response: GenericResponse,
  parentContext: Context
) => {
  const {
    fragments: [
      resourceName,
      functionName
    ]
  } = request

  const tokenEither = await getDecodedToken(request)
  if( isLeft(tokenEither) ) {
    return tokenEither
  }

  const token = unwrapEither(tokenEither)

  Object.assign(parentContext, {
    token,
    resourceName,
    response,
    request
  })

  const context = await createContext({
    parentContext,
    resourceType,
    resourceName
  })

  await Promise.all([
    prePipe({
      request,
      token,
      response,
      context
    })
  ])

  const fnEither = await getFunction(resourceName, functionName, token.user, `${resourceType}s`)
  if( isLeft(fnEither) ) {
    const error = unwrapEither(fnEither)
    switch( error ) {
      case ACErrors.ResourceNotFound: throw new Error(`no such resource ${resourceName}`)
      case ACErrors.FunctionNotFound: throw new Error(`no such function ${resourceName}@${functionName}`)
      case ACErrors.AssetNotFound: throw new Error(`resource ${resourceName} has no registered functions`)
      default: throw new Error(`unknown error: ${error}`)
    }
  }

  const fn = unwrapEither(fnEither)
  const result = await fn(request.req.payload, context)

  return postPipe({
    request,
    result,
    context,
    resourceName,
    resourceType
  })
}

export const regularVerb = (functionName: RegularVerb) => async (
  request: MatchedRequest,
  response: GenericResponse,
  parentContext: Context
) => {
  const {
    fragments: [
      resourceName,
      id
    ]
  } = request

  const tokenEither = await getDecodedToken(request)
  if( isLeft(tokenEither) ) {
    return tokenEither
  }

  const token = unwrapEither(tokenEither)

  Object.assign(parentContext, {
    token,
    resourceName,
    response,
    request
  })

  const context = await createContext({
    parentContext,
    resourceName
  })

  await Promise.all([
    prePipe({
      request,
      token,
      response,
      context
    })
  ])

  const requestCopy = Object.assign({}, request)

  if( id ) {
    requestCopy.req.payload.filters = {
      ...requestCopy.req.payload.filters||{},
      _id: id
    }

    if( 'what' in requestCopy.req.payload ) {
      requestCopy.req.payload.what._id = id
    }
  }

  const fnEither = await getFunction(resourceName, functionName, token.user)
  if( isLeft(fnEither) ) {
    const error = unwrapEither(fnEither)
    return {
      error
    }
  }

  const fn = unwrapEither(fnEither)
  const result = await fn(request.req.payload, context)

  return postPipe({
    request,
    result,
    context,
    resourceName,
    resourceType: 'collection'
  })
}

export const fileDownload = async (
  request: MatchedRequest,
  response: GenericResponse,
  parentContext: Context
) => {
  const tokenEither = await getDecodedToken(request)
  if( isLeft(tokenEither) ) {
    return tokenEither
  }

  const token = unwrapEither(tokenEither)
  parentContext.token = token

  const context = await createContext({
    resourceName: 'file',
    parentContext
  })

  const [hash, options] = request.fragments
  const { filename, content, mime } = await (unsafe(await getFunction('file', 'download')))(hash, context)

  const has = (opt: string) => options?.split('/').includes(opt)

  // return h.response(content)
  //   .header('content-type', mime)
  //   .header('content-disposition', `${has('download') ? 'attachment; ' : ''}filename=${filename}`)
}
