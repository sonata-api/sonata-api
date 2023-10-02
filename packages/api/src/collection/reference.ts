import type { CollectionProperty } from '@sonata-api/types'
import { prepareCollectionName } from '../database'

export type GetReferenceOptions = {
  memoize?: string
}

export type BuildLookupOptions = {
  parent?: string
  depth?: number
  maxDepth?: number
  memoize?: string
}

export type Reference = {
  isArray?: boolean
  deepReferences?: Record<string, ReferenceMap>
  referencedCollection?: string
}

export type ReferenceMap = Record<string, Reference>

const referenceMemo: Record<string, ReferenceMap | {}> = {}
const lookupMemo: Record<string, ReturnType<typeof buildLookupPipeline>> = {}

export const getReferences = (
  properties: NonNullable<CollectionProperty['properties']>,
  options?: GetReferenceOptions
) => {
  const {
    memoize
  } = options || {}

  if( memoize ) {
    if( referenceMemo[memoize] ) {
      return referenceMemo[memoize]
    }
  }

  const references: ReferenceMap = {}

  for( const [propName, property] of Object.entries(properties) ) {
    const referencedCollection = property.$ref || property.items?.$ref
    let deepReferences: Reference['deepReferences']

    if( !referencedCollection ) {
      const entrypoint = property.items || property
      // if( property.additionalProperties ) {
      //   deepReferences[propName] = getReferences(propName, property.additionalProperties, {
      //     memoize: false
      //   })
      // }

      if( entrypoint.properties ) {
        deepReferences ??= {}
        deepReferences[propName] = getReferences(entrypoint.properties)
      }

      if( !deepReferences ) {
        continue
      }
    }

    const reference: Reference = {}

    if( property.type === 'array' ) {
      reference.isArray = true
    }
    if( referencedCollection ) {
      reference.referencedCollection = referencedCollection
    }
    if( deepReferences ) {
      reference.deepReferences = deepReferences
    }

    references[propName] = reference
  }

  if( memoize ) {
    referenceMemo[memoize] = references
  }

  return references
}

export const buildLookupPipeline = (referenceMap: ReferenceMap | {}, options?: BuildLookupOptions): any[] => {
  const {
    parent,
    depth = 0,
    maxDepth = 3,
    memoize
  } = options || {}

  if( memoize && lookupMemo[memoize] ) {
    return lookupMemo[memoize]
  }

  const withParent = (propName: string) => {
    return parent
      ? `${parent}.${propName}`
      : propName
  }

  const result = Object.entries(referenceMap).reduce((a, [propName, reference]) => {
    const pipeline = a
    if( reference.referencedCollection ) {
      pipeline.push({
        $lookup: {
          from: prepareCollectionName(reference.referencedCollection),
          foreignField: '_id',
          localField: withParent(propName),
          as: withParent(propName)
        }
      })

      if( !reference.isArray ) {
        pipeline.push({
          $unwind: {
            path: `$${withParent(propName)}`,
            preserveNullAndEmptyArrays: true

          }
        })
      }
    }

    else if( reference.deepReferences && depth <= maxDepth ) {
      Object.entries(reference.deepReferences).forEach(([refName, refMap]) => {
        pipeline.push(...buildLookupPipeline(refMap, {
          ...options,
          depth: depth + 1,
          parent: withParent(refName),
        }))
      })
    }

    return pipeline

  }, [] as Array<any>)

  if( memoize ) {
    lookupMemo[memoize] = result
  }

  return result
}
