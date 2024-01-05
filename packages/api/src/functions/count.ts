import type { Context, SchemaWithId, CountPayload } from '@sonata-api/types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import { traverseDocument } from '../collection'

export const count = async <TContext extends Context>(
  payload: CountPayload<SchemaWithId<Context['description']>>,
  context: TContext extends Context<infer Description>
    ? TContext
    : never
) => {
  const accessControl = useAccessControl(context)
  const { filters } = unsafe(await accessControl.beforeRead(payload))
  const { $text, ...filtersRest } = filters

  const traversedFilters = unsafe(await traverseDocument(filtersRest, context.description, {
    autoCast: true,
    allowOperators: true
  }))


  if( $text ) {
    const pipeline = []
    if( $text ) {
      pipeline.push({
        $match: {
          $text
        }
      })
    }

    pipeline.push({
      $match: traversedFilters
    })

    pipeline.push({
      $count: 'total'
    })

    const result = await context.collection.model.aggregate(pipeline).next()
    return result
      ? result.total
      : 0
  }

  return context.collection.model.countDocuments(traversedFilters)
}
