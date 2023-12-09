import type { CollectionDocument, Filters, OptionalId } from '@sonata-api/types'
import type { Context } from '../types'
import { useAccessControl } from '@sonata-api/access-control'
import { unsafe } from '@sonata-api/common'
import { traverseDocument } from '../collection'

export type CountPayload<TDocument extends CollectionDocument<OptionalId<any>>> = {
  filters?: Filters<TDocument>
}

export const count = <TDocument extends CollectionDocument<OptionalId<any>>>() => async <TContext>(
  payload: CountPayload<TDocument>,
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

    const { total } = await context.model.aggregate(pipeline).next()
    return total
  }

  return context.model.countDocuments(traversedFilters)
}
