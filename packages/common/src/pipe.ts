type Rest<T extends any[]> = T extends [infer _First, ...infer Tail]
  ? Tail
  : []

export type PipeOptions = {
  returnFirst?: boolean | ((value: any) => boolean)
}

export const pipe = <TFunction extends (...args: any) => any>(functions: TFunction[], options?: PipeOptions) => {
  const {
    returnFirst
  } = options || {}

  return async (value: Parameters<TFunction>[0], ...args: Rest<Parameters<TFunction>>) => {
    let ret: ReturnType<TFunction> = value

    for( const fn of functions ) {
      ret = await fn(ret, ...args)
      if( returnFirst && ret !== undefined ) {
        switch( typeof returnFirst ) {
          case 'function': {
            if( returnFirst(ret) ) {
              return ret
            }
          }
          default:
            return ret
        }
      }
    }

    return ret
  }
}
