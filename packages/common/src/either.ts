export type Left<T> = {
  readonly _tag: 'Left'
  readonly value: T
}

export type Right<T> = {
  readonly _tag: 'Right'
  readonly value: T
}

export type Either<L, R> = Left<L> | Right<R>

export const left = <const T>(value: T): Left<T> => <const>({
  _tag: 'Left',
  value
})

export const right = <const T>(value: T): Right<T> => <const>({
  _tag: 'Right',
  value
})

export const isLeft = <L>(either: Either<L, any>): either is Left<L> => {
  return either._tag === 'Left'
}

export const isRight = <R>(either: Either<any, R>): either is Right<R> => {
  return either._tag === 'Right'
}

export const unwrapEither = <L, R>(either: Either<L, R>) => {
  return either.value
}

export const error = left
export const ok = right

export const unsafe = <L, R>(either: Either<L, R>, message?: any) => {
  if( either._tag !== 'Right' ) {
    throw new Error(`unsafe threw: ${either.value} (${message || '-'})`)
  }

  return either.value
}
