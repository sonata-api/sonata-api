import type { InstanceConfig } from  './types'
import path from 'path'
import { deserialize } from '@sonata-api/common'
import { writeFile, mkdir } from 'fs/promises'
import { topLevel } from './topLevel'
import { apiUrl } from './utils'

const mirrorDts = (mirrorObj: any) => {
  const collections = mirrorObj.descriptions

  return `import type {
  InferProperty,
  InferResponse,
  SchemaWithId,
  MakeEndpoint,
  RequestMethod,
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
    [Route in keyof MirrorRouter]: {
      [Method in keyof MirrorRouter[Route]]: Method extends RequestMethod
        ? MirrorRouter[Route][Method] extends infer RouteContract
          ? RouteContract extends
            | { response: infer RouteResponse }
            | { payload: infer RoutePayload  }
            | { query: infer RoutePayload  }
            ? MakeEndpoint<Route, Method, InferResponse<RouteResponse>, InferProperty<RoutePayload>>
            : MakeEndpoint<Route, Method>
          : never
        : never
    } extends infer Methods
      ? Methods[keyof Methods]
      : never
  } extends infer Endpoints
    ? UnionToIntersection<Endpoints[keyof Endpoints]>
    : never

  type StrongelyTypedTLO = TopLevelObject & Endpoints & {
    [K in keyof MirrorDescriptions]: SchemaWithId<MirrorDescriptions[K]> extends infer Document
      ? CollectionFunctions<Document> extends infer Functions
        ? Omit<TLOFunctions, keyof Functions> & {
          [P in keyof Functions]: {
            POST: Functions[P]
          }
        }
        : never
      : never
  }

  export const url: string
  export const aeria: StrongelyTypedTLO
}\n
  `
}

export const runtimeCjs = (config: InstanceConfig) =>
`const config = ${JSON.stringify(config)}
exports.config = config
exports.url = '${apiUrl(config)}'
exports.aeria = require('aeria-sdk/topLevel').topLevel(config)
exports.storage = require('aeria-sdk/storage').getStorage(config)
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

  const mirror = deserialize(await api.describe.POST({
    router: true
  }))

  await mkdir(runtimeBase, { recursive: true })
  await writeFile(path.join(process.cwd(), 'aeria-sdk.d.ts'), mirrorDts(mirror))
  await writeFile(path.join(runtimeBase,  '..', 'cjs', 'runtime.js'), runtimeCjs(config))
  await writeFile(path.join(runtimeBase,  '..', 'esm', 'runtime.js'), runtimeEsm(config))
}

