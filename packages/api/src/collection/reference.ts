import type { ObjectProperty } from '@sonata-api/types'
import { unsafe } from '@sonata-api/common'
import { getCollectionAsset } from '../assets'
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
  properties?: NonNullable<ObjectProperty['properties']>
}

export type Reference = {
  isArray?: boolean
  deepReferences?: Record<string, ReferenceMap>
  referencedCollection?: string
  populatedProperties?: string[]
}

export type ReferenceMap = Record<string, Reference>

const referenceMemo: Record<string, ReferenceMap | {}> = {}
const lookupMemo: Record<string, ReturnType<typeof buildLookupPipeline>> = {}

const narrowLookupPipelineProjection = (pipeline: Array<Record<string, any>>, projection: string[]) => {
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

const buildGroupPhase = (referenceMap: ReferenceMap, properties: NonNullable<ObjectProperty['properties']>) => {
  const $group = Object.keys(properties).reduce((a, propName) => {
    return {
      ...a,
      [propName]: referenceMap[propName]?.isArray
        ? { $push: `$${propName}` }
        : { $first: `$${propName}` }
    }
  }, { _id: '$_id' })

  return {
    $group
  }
}

export const getReferences = async (
  properties: NonNullable<ObjectProperty['properties']>,
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
    const referencedCollection = '$ref' in property
      ? property.$ref
      : 'items' in property
        ? '$ref' in property.items
          ? property.items.$ref
          : null
        : null

    const reference: Reference = {}

    if( depth === 2 || (property.s$populate && property.s$populate.length === 0) ) {
      continue
    }

    if( !referencedCollection ) {
      const entrypoint = 'items' in property
        ? property.items
        : property
      // if( property.additionalProperties ) {
      //   deepReferences[propName] = getReferences(propName, property.additionalProperties, {
      //     memoize: false
      //   })
      // }

      if( 'properties' in entrypoint ) {
        const deepReferences  = await getReferences(entrypoint.properties!)
        if( Object.keys(deepReferences).length > 0 ) {
          reference.deepReferences ??= {}
          reference.deepReferences[propName] = deepReferences
        }
      }

    } else {
      const description = unsafe(await getCollectionAsset(referencedCollection, 'description'))
      reference.deepReferences = await getReferences(description.properties, {
        depth: depth + 1
      })

      if( !property.s$inline ) {
        reference.populatedProperties = [
          ...property.s$indexes || description.indexes!,
          ...property.s$populate || []
        ]
      }
    }

    if( !referencedCollection && !reference.deepReferences ) {
      continue
    }


    if( 'items' in property ) {
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
    project = [],
    properties

  } = options || {}

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

  Object.entries(referenceMap).forEach(([propName, reference]) => {
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
          subPipeline.push(...buildLookupPipeline(reference.deepReferences, {
            project: reference.populatedProperties,
            properties
          }))
        }

        subPipeline.push({
          $project: Object.fromEntries(reference.populatedProperties.map((index) => [index, 1]))
        })

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

      Object.entries(reference.deepReferences).forEach(([refName, refMap]) => {
        pipeline.push(...buildLookupPipeline(refMap, {
          depth: depth + 1,
          parent: withParent(refName),
          properties
        }))
      })
    }
  })

  if( hasDeepReferences ) {
    pipeline.push(buildGroupPhase(referenceMap, properties!))
  }

  if( memoize ) {
    lookupMemo[memoize] = pipeline
  }

  return project.length > 0
    ? narrowLookupPipelineProjection(pipeline, project)
    : pipeline
}
