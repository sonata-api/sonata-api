import { getResources, type Collection, type Algorithm } from '@sonata-api/api'
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

const colorizedRoute = (color: keyof typeof colors, resourceType?: 'collection' | 'algorithm', roles?: Array<string>) =>
  (verb: string, resourceName: string, path?: string|null, parameters?: Array<string>) => {

  let line = `\x1b[1m${colors[color]}${verb}\x1b[0m\t\x1b[90m/api\x1b[0m`

  if( resourceType === 'algorithm' ) line += '/_'
  line += `/\x1b[1m${resourceName}\x1b[0m`

  if( path )        line += `/${path}`
  if( parameters )  line += `/${parameters.map(p => `{${colors.green}${p}\x1b[0m}`).join('/')}`
  if( roles )       line += ` \x1b[90m[${roles.join('|')}]\x1b[0m`
  return line
}

export const warmup = async () => {
  const { collections, algorithms } = await getResources() as {
    collections: Record<string, Collection>
    algorithms: Record<string, Algorithm>
  }

  const sortedResources = [
    ...Object.keys(collections).map((r) => <const>['collection', r]),
    ...Object.keys(algorithms).map((r) => <const>['algorithm', r]),

  ].sort((a, b) => {
    if( a[0] === 'algorithm' && b[0] === 'collection' ) {
      return -1
    }

    return a[1] > b[1]
      ? 1
      : -1
  })

  return Promise.all(sortedResources.map(async ([resourceType, resourceName]) => {
    const resource = resourceType === 'collection'
      ? await collections[resourceName]()
      : await algorithms[resourceName]()

    if( !resource.functions ) {
      return
    }

    const routes = await Promise.all(Object.keys(resource.functions).sort().map(async (functionName) => {
      const roles = await grantedFor(resourceName, functionName)

      if( resourceType === 'collection' ) switch( functionName ) {
        case 'get': return colorizedRoute('green', resourceType, roles)('GET', resourceName, null, ['id'])
        case 'getAll': return colorizedRoute('green', resourceType, roles)('GET', resourceName)
        case 'insert': return colorizedRoute('blue', resourceType, roles)('POST', resourceName)
        case 'remove': return colorizedRoute('red', resourceType, roles)('DELETE', resourceName, null, ['id'])
        default: return colorizedRoute('white', resourceType, roles)('POST', resourceName, functionName)
      }

      return colorizedRoute('white', resourceType, roles)('POST', resourceName, functionName)
    }))

    console.log(routes.join('\n'))

  }))
}
