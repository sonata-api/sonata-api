import { deepMerge, right, isLeft, unwrapEither } from '@sonata-api/common'
import type { Context, CollectionStructure, AlgorithmStructure } from '@sonata-api/api'
import type { Description } from '@sonata-api/types'
import type { ReadPayload, WritePayload, AccessControlLayer, AccessControlLayerProps } from './layers/types'
import type { AccessControl } from './types'

import {
  checkImmutability,
  checkOwnershipRead,
  checkOwnershipWrite

} from './layers'

const chainFunctions = <TPayload extends Partial<ReadPayload | WritePayload>>() => async <
  TFunction extends AccessControlLayer<any, any, any>|undefined,
  TProps extends AccessControlLayerProps<TPayload>
>(context: Context<any, any, any>, _props: TProps, ...functions: TFunction[]) => {
  const props = Object.assign({ filters: {} }, _props)

  for( const fn of functions ) {
    if( !fn ) {
      continue
    }

    const resultEither = await fn(context, props)
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
  TCollections extends Record<string, CollectionStructure>,
  TAlgorithms extends Record<string, AlgorithmStructure>,
  TAccessControl extends AccessControl<TCollections, TAlgorithms, TAccessControl>=any
>(context: Context<TDescription, TCollections, TAlgorithms, TAccessControl>) => {
  const options = context.description.options
    ? Object.assign({}, context.description.options)
    : {}

  const accessControl = context?.accessControl||{}

  const beforeRead = async <const Payload extends Partial<ReadPayload>>(payload: Payload) => {
    const newPayload = Object.assign({}, {
      filters: payload?.filters||{},
      sort: payload?.sort,
      limit: payload?.limit
    }) as ReadPayload

    if( options.queryPreset ) {
      Object.assign(newPayload, deepMerge(
        newPayload,
        options.queryPreset
      ))
    }

    if( newPayload.limit||0 > 150 ) {
      newPayload.limit = 150
    }

    const props = {
      payload: newPayload
    }

    return chainFunctions<Payload>()(
      context,
      props as any,
      (accessControl.layers?.read && context.token) && accessControl.layers.read,
      checkOwnershipRead
    )
  }

  const beforeWrite = async <const Payload extends Partial<WritePayload>>(payload: Payload) => {
    const newPayload = Object.assign({ what: {} }, payload)
    const props = {
      payload: newPayload
    }

    return chainFunctions<Payload>()(
      context,
      props,
      (accessControl.layers?.write && context.token) && accessControl.layers.write,
      checkOwnershipWrite,
      checkImmutability
    )
  }

  return {
    beforeRead,
    beforeWrite
  }
}
