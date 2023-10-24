export const deepClone = (obj: object) => {
  return typeof 'structuredClone' === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj))
}
