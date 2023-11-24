import type { Description, Property } from '@sonata-api/types'
import { getReferencedCollection, deepMerge, serialize, isLeft, unwrapEither } from '@sonata-api/common'
import { getCollectionAsset } from '../assets'
import * as presets from '../presets'

export type PreloadOptions = {
  serialize?: boolean
  memoize?: boolean
}

const preloadMemo: Record<string, Partial<Description>> = {}

export const applyPreset = (entry: Partial<Description> | Description['properties'], presetName: keyof typeof presets, parentName?: string) => {
  const preset = presets[presetName]
  const presetObject = Object.assign({}, parentName ? (preset[parentName as keyof typeof preset]||{}) : preset)

  return deepMerge(entry, presetObject, {
    callback: (_, left) => {
      if( left === null ) {
        return left
      }
    }
  })
}

export const preloadDescription = async <Options extends PreloadOptions, Return=Options extends { serialize: true }
  ? Buffer
  : Description
>(originalDescription: Partial<Description>, options?: Options) => {
  const {
    memoize = true
  } = options || {}

  if( memoize && preloadMemo[originalDescription.$id!] ) {
    const description =  preloadMemo[originalDescription.$id!]
    return (options?.serialize
      ? serialize(description)
      : description) as Return
  }

  const description = Object.assign({}, originalDescription)

  if( description.alias ) {
    const aliasedCollectionEither = await getCollectionAsset(description.alias as keyof Collections, 'description')
    if( isLeft(aliasedCollectionEither) ) {
      throw new Error(`description of ${description.alias} not found`)
    }

    const aliasedCollDescription = unwrapEither(aliasedCollectionEither)

    const {
      $id: collectionName,
      ...aliasedCollection

    } = aliasedCollDescription

    const temp = Object.assign(aliasedCollection, description)
    Object.assign(description, temp)
  }

  const descriptionPresets = (description.presets?.slice() || []) as (keyof typeof presets)[]

  if( description.owned ) {
    descriptionPresets.push('owned')
  }

  if( description.timestamps !== false ) {
    descriptionPresets.push('timestamped')
  }

  if( descriptionPresets.length > 0 ) {
    const merge = descriptionPresets?.reduce(
      (a, presetName) => applyPreset(a, presetName),
      description
    )

    Object.assign(description, merge)
  }

  if( description.properties ) {
    description.properties = await Object.entries(description.properties).reduce(async (a, [key, _property]) => {
      const property = Object.assign({}, _property)
      const reference = getReferencedCollection(property)

      if( reference ) {
        property.isReference = true
        property.isFile = reference.$ref === 'file'
        property.referencedCollection = reference.$ref

        if( !reference.indexes && !reference.inline ) {
          const referenceDescriptionEither = await getCollectionAsset(reference.$ref! as keyof Collections, 'description')
          if( isLeft(referenceDescriptionEither) ) {
            throw new Error(`description of ${reference.$ref} not found`)
          }

          const referenceDescription = unwrapEither(referenceDescriptionEither)
          const indexes = reference.indexes = referenceDescription.indexes?.slice()

          if( !indexes ) {
            throw new Error(
              `neither indexes or inline are present on reference property or indexes is set on target description on ${description.$id}.${key}`
            )
          }
        }
      }

      if( 'items' in property && 'properties' in property.items ) {
        property.items = await preloadDescription(property.items, {
          memoize: false
        })
      }

      if( property.getter ) {
        return {
          ...await a,
          [key]: {
            ...property,
            readOnly: true,
            isGetter: true
          }
        }
      }

      if( 'properties' in property ) {
        return {
          ...await a,
          [key]: await preloadDescription(property, {
            memoize: false
          })
        }
      }

      return {
        ...await a,
        [key]: property
      }
    }, {} as Promise<Record<Lowercase<string>, Property>>)
  }

  if( memoize ) {
    preloadMemo[originalDescription.$id!] = description
  }

  return (options?.serialize
    ? serialize(description)
    : description) as Return
}
