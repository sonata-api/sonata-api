export type MergeOptions = {
  arrays?: false
  callback?: (key: string, leftVal: any, rightVal: any)=> any
}

type IsString<T> = T extends string
  ? T extends `${T}${T}`
    ? true
    : false
  : false

type DeepMerge<L, R> = {
  [P in keyof L | keyof R]: P extends keyof R
    ? P extends keyof L
      ? L[P] extends infer Left
        ? R[P] extends infer Right
          ? Right extends readonly (infer R0)[]
            ? Left extends readonly (infer L0)[]
              ? IsString<L0> extends true
                ? Right
                : readonly (R0 | L0)[]
              : Right
            : Right extends Record<string, any>
              ? Left extends Record<string, any>
                ? Left extends (...args: any[]) => any
                  ? Right
                  : DeepMerge<Left, Right>
                : Right
              : Right
          : never
        : never
      : R[P]
    : P extends keyof L
      ? L[P]
      : never
}

export const deepMerge = <
  const TLeft extends Record<string, any>,
  const TRight extends Record<string, any>,
>(left: TLeft, right: TRight, options?: MergeOptions) => {
  const result = Object.assign({}, left)
  const { arrays = true } = options || {}

  for( const key in right ) {
    const leftVal: any = result[key]
    const rightVal: any = right[key]

    if( options?.callback ) {
      const res = options.callback(key, leftVal, rightVal)
      if( res !== undefined ) {
        result[key] = res
        continue
      }
    }

    if( Array.isArray(leftVal) && Array.isArray(rightVal) ) {
      result[key] = arrays
        ? result[key].concat(...rightVal)
        : rightVal

      continue
    }

    if( rightVal instanceof Function ) {
      result[key] = rightVal
      continue
    }

    if( leftVal instanceof Object && rightVal instanceof Object ) {
      if( rightVal.constructor !== Object ) {
        result[key] = rightVal
        continue
      }

      result[key] = deepMerge(leftVal, rightVal, options) as any
      continue
    }

    result[key] = rightVal
  }

  return result as DeepMerge<TLeft, TRight>
}

