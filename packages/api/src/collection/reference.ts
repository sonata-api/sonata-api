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

export type ReferenceMap = Record<string, Reference | undefined>

export type BuildLookupOptions = {
  parent?: string
  depth?: number
  maxDepth?: number
  memoize?: string
  project?: string[]
  properties: NonNullable<FixedObjectProperty['properties']>
}

const referenceMemo: Record<string, ReferenceMap | {} | undefined> = {}
const lookupMemo: Record<string, Awaited<ReturnType<typeof buildLookupPipeline>> | undefined> = {}

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

export const getReferences = async (properties: NonNullable<FixedObjectProperty['properties']>,
  options?: GetReferenceOptions) => {
  const {
    depth = 0,
    memoize,
  } = options || {}

  if( memoize ) {
    if( referenceMemo[memoize] ) {
      return referenceMemo[memoize]!
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
        depth: depth + 1,
      })

      if( Object.keys(deepReferences).length > 0 ) {
        reference.deepReferences = deepReferences
      }

      const indexes = refProperty.indexes
        ? refProperty.indexes
        : description.indexes || []

      reference.populatedProperties = [
        ...indexes,
        ...refProperty.populate || [],
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
    memoize: memoizeId,
    project = [],
    properties,
  } = options

  const memoize = `${memoizeId}-${project.sort().join('-')}`

  if( memoizeId && lookupMemo[memoize] ) {
    const result = lookupMemo[memoize]!
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
  if( parent ) {
    pipeline.push({
      $unwind: {
        path: `$${parent}`,
        preserveNullAndEmptyArrays: true,
      },
    })
  }

  for( const [propName, reference] of Object.entries(referenceMap) ) {
    if( !reference ) {
      continue
    }

    if( reference.referencedCollection ) {
      if( !reference.populatedProperties ) {
        pipeline.push({
          $lookup: {
            from: prepareCollectionName(reference.referencedCollection),
            foreignField: '_id',
            localField: withParent(propName),
            as: withParent(propName),
          },
        })

      } else {
        const subPipeline: any[] = []
        if( reference.deepReferences ) {
          const subProperties = unsafe(await getCollectionAsset(reference.referencedCollection, 'description')).properties
          subPipeline.push(...await buildLookupPipeline(reference.deepReferences, {
            project: reference.populatedProperties,
            properties: subProperties,
          }))
        }

        if( reference.populatedProperties.length > 0 ) {
          subPipeline.push({
            $project: Object.fromEntries(reference.populatedProperties.map((index) => [
              index,
              1,
            ])),
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
                    [],
                  ],
                },
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
                      '$$ids',
                    ],
                  },
                },
              },
              ...subPipeline,
            ],
          },
        })
      }

      if( !reference.isArray ) {
        pipeline.push({
          $unwind: {
            path: `$${withParent(propName)}`,
            preserveNullAndEmptyArrays: true,
          },
        })
      }
    } else if( reference.deepReferences && depth <= maxDepth ) {
      for( const [refName, refMap] of Object.entries(reference.deepReferences) ) {
        const sourceProps = reference.referencedCollection
          ? unsafe(await getCollectionAsset(reference.referencedCollection, 'description')).properties
          : properties

        /* eslint-disable-next-line */
        const sourceProperty = (refName in sourceProps
          ? sourceProps[refName]
          : sourceProps) as FixedObjectProperty | (RefProperty & { items: FixedObjectProperty })

        const refProperties = 'items' in sourceProperty
          ? sourceProperty.items.properties
          : sourceProperty.properties

        pipeline.push(...await buildLookupPipeline(refMap, {
          depth: depth + 1,
          parent: withParent(refName),
          properties: refProperties,
        }))
      }
    }
  }

  if( memoizeId ) {
    lookupMemo[memoize] = pipeline
  }

  return project.length > 0
    ? narrowLookupPipelineProjection(pipeline, project)
    : pipeline
}

