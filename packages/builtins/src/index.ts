import type {} from 'mongodb'
import type {} from '@sonata-api/validation'
export * from './collections'
export * from './utils'
export * as systemFunctions from './functions'

import {
  file,
  tempFile,
  log,
  resourceUsage,
  user,
} from './collections'

type File = typeof file.item
type TempFile = typeof tempFile.item
type Log = typeof log.item
type ResourceUsage = typeof resourceUsage.item
type User = typeof user.item

export const collections = {
  file,
  tempFile,
  log,
  resourceUsage,
  user,
}

export type {
  File,
  TempFile,
  Log,
  ResourceUsage,
  User,
}

