import type { Description, OptionalId } from '@sonata-api/types'
import { freshItem } from '@sonata-api/common'

export const normalizeProjection = <
  TDescription extends Pick<Description, 'properties'>,
  TProjectedProperties extends (keyof TDescription['properties'])[],
>(
  properties: TProjectedProperties,
  description: TDescription,
) => {
  const target = [
    ...properties,
  ]
  if( target.length === 0 ) {
    target.push(...Object.keys(description.properties) as (keyof TDescription['properties'])[])
  }

  const projection = target.reduce((a, key) => {
    if( description.properties[key]?.hidden ) {
      return a
    }

    return {
      ...a,
      [key]: 1,
    }
  }, {})

  return Object.keys(projection).length === 0
    ? null
    : projection
}

export const fill = <TDocument extends OptionalId<any>>(
  item: TDocument & Record<string, any>,
  description: Pick<Description, 'properties' | 'freshItem'>,
) => {
  return Object.assign(freshItem(description), item)
}

export const prepareInsert = (payload: any,
  description: Pick<Description,
    | 'properties'
    | 'form'
    | 'writable'
    | 'owned'
    | 'defaults'
  >) => {
  const rest = Object.assign({}, payload)
  const docId = payload._id

  delete rest._id
  delete rest.created_at
  delete rest.updated_at

  const forbidden = (key: string) => {
    return description.properties[key]?.readOnly
      || (description.writable && !description.writable.includes(key)
      )
  }
  const prepareUpdate = () => Object.entries(rest).reduce((a: Record<string, any>, [
    key,
    value,
  ]) => {
    if( forbidden(key) ) {
      return a
    }

    // it's a mongodb operation
    if( key[0] === '$' && !description.writable ) {
      a[key] = value
      return a
    }

    if( [
      undefined,
      null,
    ].includes(value as any) ) {
      a.$unset[key] = 1
      return a
    }

    a.$set[key] = value
    return a

  }, {
    $set: description.defaults || {},
    $unset: {},
  })

  const prepareCreate = () => Object.entries(rest).reduce((a, [
    key,
    value,
  ]) => {
    if( forbidden(key) || [
      undefined,
      null,
    ].includes(value as any) ) {
      return a
    }

    return {
      ...a,
      [key]: value,
    }
  }, description.defaults || {})

  const what = docId
    ? prepareUpdate()
    : prepareCreate()

  Object.keys(what).forEach((k) => {
    if( what && typeof what[k] === 'object' && JSON.stringify(what) === '{}' ) {
      delete what[k]
    }
  })

  return what
}
