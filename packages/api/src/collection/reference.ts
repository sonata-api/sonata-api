import type { FixedObjectProperty, RefProperty } from '@sonata-api/types'
import { unsafe, getReferenceProperty } from '@sonata-api/common'
import { getCollectionAsset } from '../assets'
import { prepareCollectionName } from '../database'

export type GetReferenceOptions = {
  memoize?: string
  depth?: number
}

export type Reference = {
  isArray?: boolean
  deepReferences?: Record<string, ReferenceMap>
  referencedCollection?: string
  populatedProperties?: string[]
}

export type ReferenceMap = Record<string, Reference>

export type BuildLookupOptions = {
  parent?: string
  depth?: number
  maxDepth?: number
  memoize?: string
  project?: string[]
  properties: NonNullable<FixedObjectProperty['properties']>
}

const referenceMemo: Record<string, ReferenceMap | {}> = {}
const lookupMemo: Record<string, Awaited<ReturnType<typeof buildLookupPipeline>>> = {}

const narrowLookupPipelineProjection = (pipeline: Record<string, any>[], projection: string[]) => {
  const hasAny = (propName: string) => {
    return propName.includes('.') || projection.includes(propName)
  }

  return pipeline.filter((stage) => {
    if( stage.$lookup ) {
      return hasAny(stage.$lookup.as)
    }

    if( stage.$unwind ) {
      return hasAny(stage.$unwind.path.slice(1))
    }

    return true
  })
}

const buildGroupPhase = (referenceMap: ReferenceMap, properties: NonNullable<FixedObjectProperty['properties']>) => {
  const $group = Object.keys(properties).reduce((a, propName) => {
    const refMap = referenceMap[propName] || {}
    const groupType = !refMap.referencedCollection && refMap.isArray
      ? 'push'
      : 'first'

    return {
      ...a,
      [propName]: {
        [`$${groupType}`]: `$${propName}`
      }
    }
  }, { _id: '$_id' })

  return {
    $group
  }
}

const buildArrayCleanupPhase = (referenceMap: ReferenceMap) => {
  const $set = Object.entries(referenceMap).reduce((a, [refName, refMap]) => {
    if( !refMap.isArray || refMap.referencedCollection ) {
      return a
    }

    return {
      ...a,
      [refName]: {
        $filter: {
          input: `$${refName}`,
          as: `${refName}_elem`,
          cond: {
            $ne: [
              `$$${refName}_elem`,
              {}
            ]
          }
        }
      }
    }
  }, {})

  return Object.keys($set).length > 0
    ? { $set }
    : null
}

export const getReferences = async (
  properties: NonNullable<FixedObjectProperty['properties']>,
  options?: GetReferenceOptions
) => {
  const {
    depth = 0,
    memoize,

  } = options || {}

  if( memoize ) {
    if( referenceMemo[memoize] ) {
      return referenceMemo[memoize]
    }
  }

  const references: ReferenceMap = {}

  for( const [propName, property] of Object.entries(properties) ) {
    const refProperty = getReferenceProperty(property)
    const reference: Reference = {}

    if( depth === 2 || (refProperty && refProperty.populate && refProperty.populate.length === 0) ) {
      continue
    }

    if( !refProperty ) {
      const entrypoint = 'items' in property
        ? property.items
        : property

      // if( property.additionalProperties ) {
      //   deepReferences[propName] = getReferences(propName, property.additionalProperties, {
      //     memoize: false
      //   })
      // }

      if( 'properties' in entrypoint ) {
        const deepReferences = await getReferences(entrypoint.properties)

        if( Object.keys(deepReferences).length > 0 ) {
          reference.deepReferences ??= {}
          reference.deepReferences[propName] = deepReferences
        }
      }

    } else {
      const description = unsafe(await getCollectionAsset(refProperty.$ref, 'description'))
      const deepReferences = await getReferences(description.properties, {
        depth: depth + 1
      })

      if( Object.keys(deepReferences).length > 0 ) {
        reference.deepReferences = deepReferences
      }

      const indexes = refProperty.indexes
        ? refProperty.indexes
        : description.indexes || []

      reference.populatedProperties = [
        ...indexes,
        ...refProperty.populate || []
      ]
    }

    if( !refProperty?.$ref && !reference.deepReferences ) {
      continue
    }

    if( 'items' in property ) {
      reference.isArray = true
    }

    if( refProperty?.$ref ) {
      reference.referencedCollection = refProperty.$ref
    }

    references[propName] = reference
  }

  if( memoize ) {
    referenceMemo[memoize] = references
  }

  return references
}

export const buildLookupPipeline = async (referenceMap: ReferenceMap | {}, options: BuildLookupOptions): Promise<any[]> => {
  const {
    parent,
    depth = 0,
    maxDepth = 3,
    memoize,
    project = [],
    properties

  } = options

  if( memoize && lookupMemo[memoize] ) {
    const result = lookupMemo[memoize]
    return project.length > 0
      ? narrowLookupPipelineProjection(result, project)
      : result
  }

  const withParent = (propName: string) => {
    return parent
      ? `${parent}.${propName}`
      : propName
  }

  const pipeline: any[] = []
  let hasDeepReferences = false

  if( parent ) {
    pipeline.push({
      $unwind: {
        path: `$${parent}`,
        preserveNullAndEmptyArrays: true
      }
    })
  }

  for( const [propName, reference] of Object.entries(referenceMap) ) {
    if( reference.referencedCollection ) {
      if( !reference.populatedProperties ) {
        pipeline.push({
          $lookup: {
            from: prepareCollectionName(reference.referencedCollection),
            foreignField: '_id',
            localField: withParent(propName),
            as: withParent(propName)
          }
        })

      } else {
        const subPipeline: any[] = []
        if( reference.deepReferences ) {
          const subProperties = unsafe(await getCollectionAsset(reference.referencedCollection, 'description')).properties
          subPipeline.push(...await buildLookupPipeline(reference.deepReferences, {
            project: reference.populatedProperties,
            properties: subProperties
          }))
        }

        if( reference.populatedProperties.length > 0 ) {
          subPipeline.push({
            $project: Object.fromEntries(reference.populatedProperties.map((index) => [index, 1]))
          })
        }

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
      hasDeepReferences = true

      for( const [refName, refMap] of Object.entries(reference.deepReferences) ) {
        const sourceProps = reference.referencedCollection
          ? unsafe(await getCollectionAsset(reference.referencedCollection, 'description')).properties
          : properties

        const sourceProperty = (refName in sourceProps
          ? sourceProps[refName as any]
          : sourceProps) as FixedObjectProperty | (RefProperty & { items: FixedObjectProperty })

        const refProperties = 'items' in sourceProperty
            ? sourceProperty.items.properties
            : sourceProperty.properties

        pipeline.push(...await buildLookupPipeline(refMap, {
          depth: depth + 1,
          parent: withParent(refName),
          properties: refProperties
        }))
      }
    }
  }

  if( hasDeepReferences ) {
    pipeline.push(buildGroupPhase(referenceMap, properties))

    const arrayCleanupPhase = buildArrayCleanupPhase(referenceMap)
    if( arrayCleanupPhase ) {
      pipeline.push(arrayCleanupPhase)
    }
  }

  if( memoize ) {
    lookupMemo[memoize] = pipeline
  }

  return project.length > 0
    ? narrowLookupPipelineProjection(pipeline, project)
    : pipeline
}

