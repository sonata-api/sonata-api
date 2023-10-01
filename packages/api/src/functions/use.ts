import type { OptionalId } from '../types'
import type { CollectionDocument } from './types'
import * as collFunctions from '.'

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
  TSelectedFunctions extends Array<keyof typeof collFunctions>
> = TSelectedFunctions extends Array<infer K>
  ? K
  : keyof typeof collFunctions

export const useFunctions = <TDocument extends CollectionDocument<OptionalId<any>>>() => <TSelectedFunctions extends Array<keyof typeof collFunctions>>(
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

export const untypedUseFunctions = (selectedFunctions: Array<keyof typeof collFunctions>) => {
  return useFunctions<any>()(selectedFunctions)
}
