type PipeOptions = {
  returnFirst?: boolean | ((value: any) => boolean)
}

export const pipe = <TFunction extends (...args: any) => any>(functions: TFunction[], options?: PipeOptions) => {
  const {
    returnFirst
  } = options || {}

  return async (value: Parameters<TFunction>[0]) => {
    let ret: ReturnType<TFunction> = value
    for( const fn of functions ) {
      ret = await fn(ret)
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
    // return functions.reduce(async (a, fn) => {
    //   const lastRet = await a
    //   if( returnFirst && lastRet !== undefined ) {
    //     switch( typeof returnFirst ) {
    //       case 'function': {
    //         if( returnFirst(lastRet) ) {
    //           return lastRet
    //         }
    //       }
    //       default:
    //         return lastRet
    //     }
    //   }

    //   return fn(lastRet)

    // }, value) as Promise<ReturnType<TFunction>>
  }
}
