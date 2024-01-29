import type { InstanceConfig } from './types'
import type { getStorage } from './storage'

export const instanceConfig = {} as InstanceConfig
export const url = ''
export const aeria = {}
export const storage = {} as ReturnType<typeof getStorage>

throw new Error('Runtime files werent generated. Run the "aeria-sdk" script first.')
