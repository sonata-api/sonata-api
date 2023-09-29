type PipeOptions = {
  returnFirst?: boolean | ((value: any) => boolean)
}

export const pipe = <TFunction extends (...args: any) => any>(functions: TFunction[], options?: PipeOptions) => {
  const {
    returnFirst
  } = options || {}

  return async (value: Parameters<TFunction>[0]) => {
    return functions.reduce(async (a, fn) => {
      const lastRet = await a
      if( returnFirst && lastRet !== undefined ) {
        switch( typeof returnFirst ) {
          case 'function': {
            if( returnFirst(lastRet) ) {
              return lastRet
            }
          }
          default:
            return lastRet
        }
      }

      return fn(lastRet)

    }, value) as Promise<ReturnType<TFunction>>
  }
}
