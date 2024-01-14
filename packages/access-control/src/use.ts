import { deepMerge, right, isLeft, unwrapEither } from '@sonata-api/common'
import type {
  Context,
  AccessControl,
  AccessControlLayer,
  AccessControlLayerProps,
  Description,
  GetAllPayload,
  InsertPayload,
} from '@sonata-api/types'

import {
  checkImmutability,
  checkOwnershipRead,
  checkOwnershipWrite,
} from './layers'

const chainFunctions = <TPayload extends Partial<GetAllPayload<any> | InsertPayload<any>>>() => async <
  TContext,
  TFunction extends AccessControlLayer | undefined,
  TProps extends AccessControlLayerProps<TPayload>,
>(
  context: TContext extends Context<any>
    ? TContext
    : never,
  _props: TProps,
  functions: TFunction[],
) => {
  const props = Object.assign({
    filters: {},
  }, _props)

  for( const fn of functions ) {
    if( !fn ) {
      continue
    }

    const resultEither = await fn(context as any, props)
    if( isLeft(resultEither) ) {
      return resultEither
    }

    const result = unwrapEither(resultEither)
    Object.assign(props.payload, result)
  }

  return right(props.payload)
}

export const useAccessControl = <
  TDescription extends Description,
  TAccessControl extends AccessControl<any, TAccessControl>=any,
>(context: Context<TDescription>) => {
  const options = context.description.options
    ? Object.assign({}, context.description.options)
    : {}

  const beforeRead = async <const Payload extends Partial<GetAllPayload<any>>>(payload?: Payload) => {
    const newPayload = Object.assign({}, payload) as GetAllPayload<any>
    newPayload.filters ??= {}
    newPayload.limit = newPayload.limit
      ? newPayload.limit > 150
        ? 100
        : newPayload.limit
      : Number(process.env.PAGINATION_LIMIT || 35)

    if( options.queryPreset ) {
      Object.assign(newPayload, deepMerge(newPayload,
        options.queryPreset))
    }

    const props = {
      payload: newPayload,
    }

    return chainFunctions<Required<Payload>>()(context,
      props as any, [
        checkOwnershipRead,
      ])
  }

  const beforeWrite = async <const Payload extends Partial<InsertPayload<any>>>(payload?: Payload) => {
    const newPayload = Object.assign({
      what: {},
    }, payload)
    const props = {
      payload: newPayload,
    }

    return chainFunctions<Payload>()(context,
      props, [
        checkOwnershipWrite,
        checkImmutability,
      ])
  }

  return {
    beforeRead,
    beforeWrite,
  }
}
