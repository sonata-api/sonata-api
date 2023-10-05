import type { CollectionProperty } from '@sonata-api/types'
import { unsafe } from '@sonata-api/common'
import { getResourceAsset } from '../assets'
import { prepareCollectionName } from '../database'

export type GetReferenceOptions = {
  memoize?: string
  depth?: number
}

export type BuildLookupOptions = {
  parent?: string
  depth?: number
  maxDepth?: number
  memoize?: string
  project?: string[]
}

export type Reference = {
  isArray?: boolean
  deepReferences?: Record<string, ReferenceMap>
  referencedCollection?: string
}

export type ReferenceMap = Record<string, Reference>

const referenceMemo: Record<string, ReferenceMap | {}> = {}
const lookupMemo: Record<string, ReturnType<typeof buildLookupPipeline>> = {}

const narrowLookupPipelineProjection = (pipeline: Array<Record<string, any>>, projection: string[]) => {
  return pipeline.filter((stage) => {
    return !stage.$lookup || projection.includes(stage.$lookup.as)
  })
}

export const getReferences = async (
  properties: NonNullable<CollectionProperty['properties']>,
  options?: GetReferenceOptions
) => {
  const {
    memoize,
    depth = 0
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

    if( depth === 2 ) {
      continue
    }

    if( !referencedCollection ) {
      const entrypoint = property.items || property
      // if( property.additionalProperties ) {
      //   deepReferences[propName] = getReferences(propName, property.additionalProperties, {
      //     memoize: false
      //   })
      // }

      if( entrypoint.properties ) {
        deepReferences ??= {}
        deepReferences[propName] = await getReferences(entrypoint.properties)
      }

    } else {
      const description = unsafe(await getResourceAsset(referencedCollection, 'description'))
      deepReferences = await getReferences(description.properties, {
        depth: depth + 1
      })
    }

    if( !referencedCollection && !deepReferences ) {
      continue
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
    memoize,
    project
  } = options || {}

  if( memoize && lookupMemo[memoize] ) {
    const result = lookupMemo[memoize]
    return project
      ? narrowLookupPipelineProjection(result, project)
      : result
  }

  const withParent = (propName: string) => {
    return parent
      ? `${parent}.${propName}`
      : propName
  }

  const result = Object.entries(referenceMap).reduce((a, [propName, reference]) => {
    const pipeline = a
    if( reference.referencedCollection ) {
      if( reference.deepReferences ) {
        const subPipeline = buildLookupPipeline(reference.deepReferences)
        if( subPipeline.length > 0 ) {
          pipeline.push({
            $lookup: {
              from: prepareCollectionName(reference.referencedCollection),
              let: {
                'ids': !reference.isArray
                  ? `$${withParent(propName)}`
                  : {
                    $ifNull: [
                      `$${withParent(propName)}`,
                      []
                    ]
                  }
              },
              as: withParent(propName),
              pipeline: [
                {
                  $match: {
                    $expr: {
                      [
                        reference.isArray
                          ? '$in'
                          : '$eq'
                      ]: [
                        '$_id',
                        '$$ids'
                      ]
                    }
                  }
                },
                ...subPipeline
              ]
            }
          })
        }

        else {
          pipeline.push({
            $lookup: {
              from: prepareCollectionName(reference.referencedCollection),
              foreignField: '_id',
              localField: withParent(propName),
              as: withParent(propName)
            }
          })
        }
      }

      if( !reference.isArray ) {
        pipeline.push({
          $unwind: {
            path: `$${withParent(propName)}`,
            preserveNullAndEmptyArrays: true
          }
        })
      }

      return pipeline
    }

    if( reference.deepReferences && depth <= maxDepth ) {
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

  return project
    ? narrowLookupPipelineProjection(result, project)
    : result
}
