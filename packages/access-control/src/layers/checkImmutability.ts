import type { AccessControlLayerProps, ReadPayload, WritePayload } from './types'
import type { Context } from '@sonata-api/api'
import { ObjectId } from 'mongodb'
import { left, right, isLeft } from '@sonata-api/common'
import { ACErrors } from '../errors'

const internalCheckImmutability = async (context: Context, props: AccessControlLayerProps<ReadPayload|WritePayload>) => {
  const {
    propertyName = '',
    parentId,
    childId,
    payload

  } = props

  const { description } = context
  const source = 'what' in payload
    ? payload.what
    : payload.filters

  const property = description.properties[propertyName]
  if( !property ) {
    return right(props.payload)
  }

  const immutable =  parentId && (
    description.immutable === true
    || (Array.isArray(description.immutable) && description.immutable.includes(propertyName) )
  )

  const currentDocument = await context.model.findOne({ _id: new ObjectId(parentId) })
  if( !currentDocument ) {
    return left(ACErrors.ImmutabilityParentNotFound)
  }

  if( childId ) {
    if(
      (Array.isArray(currentDocument[propertyName]) && !currentDocument[propertyName].some((child) => child.toString() === childId))
      || (!Array.isArray(currentDocument[propertyName]) && currentDocument[propertyName] && currentDocument[propertyName] !== childId.toString())
    ) {
      return left(ACErrors.ImmutabilityIncorrectChild)
    }
  }

  const fulfilled = currentDocument[propertyName]
    && (typeof currentDocument[propertyName] === 'object' && !Object.keys(currentDocument[propertyName]).length)

  if(
    immutable
    && fulfilled
    && ( property.inline || (currentDocument[propertyName] as any).toString() !== source[propertyName] )
  ) {
    return left(ACErrors.ImmutabilityTargetImmutable)
  }

  return right(props.payload)
}

export const checkImmutability = async (context: Context, props: AccessControlLayerProps<ReadPayload|WritePayload>) => {
  if( !props.parentId ) {
    return right(props.payload)
  }

  if( props.payload ) {
    for( const propertyName of Object.keys(props.payload) ) {
      const result = await internalCheckImmutability(context, {
        ...props,
        propertyName
      })

      if( isLeft(result) ) {
        return result
      }
    }
  }

  return internalCheckImmutability(context, props)
}
