export const pipe = <TFunction extends (...args: any) => any>(...functions: TFunction[]) => {
  return async (value: Parameters<TFunction>[0]) => functions.reduce(async (a, fn) => fn(await a), value) as Promise<ReturnType<TFunction>>
}
