export const arraysIntersects = <T extends Array<string>>(subject: T|string, arr: T|undefined) => {
  if( !arr ) {
    return false
  }

  return Array.isArray(subject)
    ? subject.some((e) => arr.includes(e))
    : arr.includes(subject)
}
