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
      return returnFirst && lastRet !== undefined
        ? lastRet
        : fn(lastRet)

    }, value) as Promise<ReturnType<TFunction>>
  }
}
