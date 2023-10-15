import { deepMerge, right, isLeft, unwrapEither } from '@sonata-api/common'
import type { Context, Collections } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import type { ReadPayload, WritePayload, AccessControlLayer, AccessControlLayerProps } from './layers/types'
import type { AccessControl } from './types'

import {
  checkImmutability,
  checkOwnershipRead,
  checkOwnershipWrite

} from './layers'

const chainFunctions = <TPayload extends Partial<ReadPayload | WritePayload>>() => async <
  TContext,
  TFunction extends AccessControlLayer | undefined,
  TProps extends AccessControlLayerProps<TPayload>
>(
  context: TContext extends Context<infer _Description>
    ? TContext
    : never,
  _props: TProps,
  functions: TFunction[]
) => {
  const props = Object.assign({ filters: {} }, _props)

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
  TCollections extends Collections,
  TAccessControl extends AccessControl<TCollections, TAccessControl>=any
>(context: Context<TDescription, TCollections>) => {
  const options = context.description.options
    ? Object.assign({}, context.description.options)
    : {}

  const beforeRead = async <const Payload extends Partial<ReadPayload>>(payload?: Payload) => {
    const newPayload = Object.assign({}, payload) as ReadPayload
    newPayload.filters ??= {}
    newPayload.limit = newPayload.limit
      ? newPayload.limit > 150
        ? 100
        : newPayload.limit
      : Number(process.env.PAGINATION_LIMIT || 35)

    if( options.queryPreset ) {
      Object.assign(newPayload, deepMerge(
        newPayload,
        options.queryPreset
      ))
    }

    const props = {
      payload: newPayload
    }

    return chainFunctions<Required<Payload>>()(
      context,
      props as any, [
        checkOwnershipRead
    ])
  }

  const beforeWrite = async <const Payload extends Partial<WritePayload>>(payload?: Payload) => {
    const newPayload = Object.assign({ what: {} }, payload)
    const props = {
      payload: newPayload
    }

    return chainFunctions<Payload>()(
      context,
      props, [
        checkOwnershipWrite,
        checkImmutability
    ])
  }

  return {
    beforeRead,
    beforeWrite
  }
}
