import { getCollections } from '@sonata-api/entrypoint'
import { grantedFor } from '@sonata-api/access-control'

if( process.env.NODE_ENV !== 'production' ) {
  require('dotenv').config()
}

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  white: '\x1b[37m',
}

const colorizedRoute = (color: keyof typeof colors, roles?: string[]) =>
  (verb: string, collectionName: string, path?: string|null, parameters?: string[]) => {

  let line = `\x1b[1m${colors[color]}${verb}\x1b[0m\t\x1b[90m/api\x1b[0m`
  line += `/\x1b[1m${collectionName}\x1b[0m`

  if( path )        line += `/${path}`
  if( parameters )  line += `/${parameters.map(p => `{${colors.green}${p}\x1b[0m}`).join('/')}`
  if( roles )       line += ` \x1b[90m[${roles.join('|')}]\x1b[0m`
  return line
}

export const warmup = async () => {
  const collections = await getCollections()
  const sortedCollections = Object.keys(collections).sort((a, b) => {
    return a > b
      ? 1
      : -1
  })

  return Promise.all(sortedCollections.map(async (collectionName) => {
    const collection = await collections[collectionName]()
    if( !collection.functions ) {
      return
    }

    const routes = await Promise.all(Object.keys(collection.functions).sort().map(async (functionName) => {
      const roles = await grantedFor(collectionName, functionName)

      switch( functionName ) {
        case 'get': return colorizedRoute('green', roles)('GET', collectionName, null, ['id'])
        case 'getAll': return colorizedRoute('green', roles)('GET', collectionName)
        case 'insert': return colorizedRoute('blue', roles)('POST', collectionName)
        case 'remove': return colorizedRoute('red', roles)('DELETE', collectionName, null, ['id'])
        default: return colorizedRoute('white', roles)('POST', collectionName, functionName)
      }
    }))

    console.log(routes.join('\n'))

  }))
}
