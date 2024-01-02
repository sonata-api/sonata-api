import type { InstanceConfig } from  './types'
import path from 'path'
import { deserialize } from '@sonata-api/common'
import { writeFile, mkdir } from 'fs/promises'
import { topLevel } from './topLevel'
import { apiUrl } from './utils'

const mirrorDts = (mirrorObj: any) => {
  const collections = mirrorObj.descriptions

  return `import type {
  InferSchema,
  InferResponse,
  SchemaWithId,
  MakeEndpoint,
  CollectionDocument,
  GetPayload,
  GetAllPayload,
  InsertPayload,
  RemovePayload,
  RemoveAllPayload,
  UploadPayload,
  RemoveFilePayload,
  CollectionFunctions

} from '@sonata-api/types'

declare type MirrorDescriptions = ${JSON.stringify(collections, null, 2)}\n

declare type MirrorRouter = ${JSON.stringify(mirrorObj.router, null, 2)}\n

declare global {
  type Collections = {
    [K in keyof MirrorDescriptions]: {
      item: SchemaWithId<MirrorDescriptions[K]>
    }
  }
}

declare module 'aeria-sdk' {
  import { TopLevelObject, TLOFunctions } from 'aeria-sdk'

  type UnionToIntersection<T> = (T extends any ? ((x: T) => 0) : never) extends ((x: infer R) => 0)
    ? R
    : never

  type Endpoints = {
    [Route in keyof MirrorRouter]: MirrorRouter[Route] extends infer RouteContract
      ? RouteContract extends [infer RoutePayload, infer RouteResponse]
        ? RoutePayload extends null
          ? MakeEndpoint<Route, InferResponse<RouteResponse>, undefined>
          : MakeEndpoint<Route, InferResponse<RouteResponse>, InferSchema<RoutePayload>>
        : RouteContract extends Record<string, any>
          ? MakeEndpoint<Route, any, InferSchema<RouteContract>>
          : MakeEndpoint<Route>
      : never
  } extends infer Endpoints
    ? UnionToIntersection<Endpoints[keyof Endpoints]>
    : never

  type StrongelyTypedTLO = TopLevelObject & Endpoints & {
    [K in keyof MirrorDescriptions]: SchemaWithId<MirrorDescriptions[K]> extends infer Document
      ? CollectionFunctions<Document> & Omit<TLOFunctions, keyof Functions>
      : never
  }

  export const url: string
  export const aeria: StrongelyTypedTLO
}\n
  `
}

export const runtimeCjs = (config: InstanceConfig) =>
`const { Aeria, getStorage } from 'aeria-sdk'
const config = ${JSON.stringify(config)}
exports.config = config
exports.url = '${apiUrl(config)}'
exports.aeria = Aeria(config)
exports.storage = getStorage(config)
\n`

export const runtimeEsm = (config: InstanceConfig) =>
`import { Aeria, getStorage } from 'aeria-sdk'
export const config = ${JSON.stringify(config)}
export const url = '${apiUrl(config)}'
export const aeria = Aeria(config)
export const storage = getStorage(config)
\n`

export const mirror = async (config: InstanceConfig) => {
  const api = topLevel(config)
  const runtimeBase = path.dirname(require.resolve('aeria-sdk'))

  const mirror = deserialize(await api.describe({
    router: true
  }))

  await mkdir(runtimeBase, { recursive: true })
  await writeFile(path.join(process.cwd(), 'aeria-sdk.d.ts'), mirrorDts(mirror))
  await writeFile(path.join(runtimeBase,  '..', 'cjs', 'runtime.js'), runtimeCjs(config))
  await writeFile(path.join(runtimeBase,  '..', 'esm', 'runtime.js'), runtimeEsm(config))
}
