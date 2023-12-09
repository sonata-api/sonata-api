import type { CollectionDocument, OptionalId } from '@sonata-api/types'
import * as collFunctions from '.'

export type AvailableFunction = keyof typeof collFunctions

const getFunctions = <TDocument extends CollectionDocument<OptionalId<any>>>() => ({
  count: collFunctions.count<TDocument>(),
  get: collFunctions.get<TDocument>(),
  getAll: collFunctions.getAll<TDocument>(),
  remove: collFunctions.remove<TDocument>(),
  removeAll: collFunctions.removeAll<TDocument>(),
  removeFile: collFunctions.removeFile<TDocument>(),
  insert: collFunctions.insert<TDocument>(),
  upload: collFunctions.upload<TDocument>(),
})

type SelectFunctions<
  TSelectedFunctions extends (keyof typeof collFunctions)[]
> = TSelectedFunctions extends (infer K)[]
  ? K
  : keyof typeof collFunctions

export const useFunctions = <TDocument extends CollectionDocument<OptionalId<any>>>() => <TSelectedFunctions extends AvailableFunction[]>(
  selectedFunctions?: TSelectedFunctions
): {
  [P in SelectFunctions<TSelectedFunctions>]: ReturnType<typeof getFunctions<TDocument>>[P]
} => {
  const functions = getFunctions<TDocument>()

  if( selectedFunctions ) {
    return selectedFunctions.reduce((a, fnName) => ({
      ...a,
      [fnName]: functions[fnName]
    }), {} as typeof functions)
  }

  return functions
}

export const untypedUseFunctions = (selectedFunctions: AvailableFunction[]) => {
  return useFunctions<any>()(selectedFunctions)
}
