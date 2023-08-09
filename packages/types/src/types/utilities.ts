export type ValuesOf<T> = T extends readonly string[]
  ? T[number]
  : T[keyof T]

// probably broken
export type DeepWritable<T, Skip=''> = {
  -readonly [P in keyof T]: P extends ValuesOf<Skip>
    ? T[P]
    : T[P] extends object
    ? DeepWritable<T[P]>
    : T[P]
}

export type DeepReadonly<T, Skip=''> = {
  readonly [P in keyof T]: P extends ValuesOf<Skip>
    ? T[P]
    : T[P] extends object
    ? DeepWritable<T[P]>
    : T[P]
}

