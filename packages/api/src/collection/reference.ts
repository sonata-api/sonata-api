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
  populatedProperties?: string[]
  indexes?: string[]
}

export type ReferenceMap = Record<string, Reference>

const referenceMemo: Record<string, ReferenceMap | {}> = {}
const lookupMemo: Record<string, ReturnType<typeof buildLookupPipeline>> = {}

const narrowLookupPipelineProjection = (pipeline: Array<Record<string, any>>, projection: string[]) => {
  return pipeline.filter((stage) => {
    if( stage.$lookup ) {
      return projection.includes(stage.$lookup.as)
    }

    if( stage.$unwind ) {
      return projection.includes(stage.$unwind.path.slice(1))
    }

    return true
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
    const reference: Reference = {}

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
        reference.deepReferences ??= {}
        reference.deepReferences[propName] = await getReferences(entrypoint.properties)
      }

    } else {
      const description = unsafe(await getResourceAsset(referencedCollection, 'description'))
      reference.deepReferences = await getReferences(description.properties, {
        depth: depth + 1
      })

      if( !property.s$inline ) {
        reference.indexes = [
          ...property.s$indexes || description.indexes!
        ]

        reference.populatedProperties = [
          ...reference.indexes,
          ...property.s$populate || []
        ]
      }
    }

    if( !referencedCollection && !reference.deepReferences ) {
      continue
    }


    if( property.type === 'array' ) {
      reference.isArray = true
    }
    if( referencedCollection ) {
      reference.referencedCollection = referencedCollection
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
        const subPipeline = buildLookupPipeline(reference.deepReferences, {
          project: reference.populatedProperties!
        })

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

        } else {
          if( !reference.indexes ) {
            pipeline.push({
              $lookup: {
                from: prepareCollectionName(reference.referencedCollection),
                foreignField: '_id',
                localField: withParent(propName),
                as: withParent(propName)
              }
            })

          } else {
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
                  {
                    $project: Object.fromEntries(reference.indexes!.map((index) => [index, 1]))
                  }
                ]
              }
            })
          }
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
