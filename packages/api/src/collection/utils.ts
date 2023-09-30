import type { Description } from '@sonata-api/types'
import type { OptionalId } from '../types'
import { freshItem } from '@sonata-api/common'

export const normalizeProjection = <
  TDescription extends Pick<Description, 'properties'>,
  TProjectedProperties extends (keyof TDescription['properties'])[] | Record<
    keyof TDescription['properties'],
    1|0
  >
>(
  projection: TProjectedProperties,
  description: TDescription
) => {
  if( !projection ) {
    return {}
  }

  const target: Array<any> = Array.isArray(projection)
    ? projection
    : Object.keys(projection)

  if( target.length === 0 ) {
    target.push(...Object.keys(description.properties))
  }

  return target.reduce((a, key) => {
    if( description.properties[key]?.s$hidden ) {
      return a
    }

    return {
      ...a,
      [key]: 1
    }
  }, {})
}

export const fill = <TDocument extends OptionalId<any>>(
  item: TDocument & Record<string, any>,
  description: Pick<Description, 'properties' | 'freshItem'>
) => {
  return Object.assign(freshItem(description), item)
}

export const prepareInsert = (
  payload: any,
  description: Pick<Description,
    'properties'
    | 'form'
    | 'writable'
    | 'owned'
    | 'defaults'
  >
) => {
  const {
    _id,
    created_at,
    updated_at,
    ...rest

  } = payload

  const forbidden = (key: Lowercase<string>) => {
    return description.properties[key]?.readOnly
      || (description.writable && !description.writable.includes(key)
    )
  }
  const prepareUpdate = () => Object.entries(rest as Record<string, any>).reduce((a: any, [key, value]) => {
    if( forbidden(key as Lowercase<string>) ) {
      return a
    }

    // it's a mongodb operation
    if( key[0] === '$' && !description.writable ) {
      a[key] = value
      return a
    }

    if(
        !(value instanceof Date)
        && ( [undefined, null].includes(value) || (typeof value === 'object' && !Object.keys(value).length) )
        && !Array.isArray(value)
        && !(key in (description.defaults||{}))
    ) {
      a.$unset[key] = 1
      return a
    }

    a.$set[key] = value
    return a

  }, {
    $set: description.defaults || {},
    $unset: {}
  })

  const prepareCreate = () => Object.entries(rest as Record<string, any>).reduce((a: any, [key, value]) => {
    if( forbidden(key as Lowercase<string>) || [undefined, null].includes(value) ) {
      return a
    }

    return {
      ...a,
      [key]: value
    }
  }, description.defaults || {})

  const what = _id
    ? prepareUpdate()
    : prepareCreate()

  Object.keys(what).forEach(k => {
    if( typeof what[k] === 'object' && !Object.keys(what[k]).length  ) {
      delete what[k]
    }
  })

  return what
}
