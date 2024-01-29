import chokidar from 'chokidar'
import { spawn } from 'child_process'
import { compile } from './compile'
import { log } from './log'

const compileAndSpawn = async () => {
  const result = await compile()

  if( result.success ) {
    const api = spawn('node', ['dist/index.js'])
    api.stdout.on('data', (data) => {
      process.stdout.write(data)
    })
    api.stderr.on('data', (data) => {
      process.stdout.write(data)
    })

    return api
  }
}

export const watch = async () => {
  let runningApi = await compileAndSpawn()
  const srcWatcher = chokidar.watch('./src')

  srcWatcher.on('change', async (path) => {
    if( runningApi ) {
      runningApi.kill()
    }

    log('info', `change detected in file: ${path}`)
    log('info', 'compiling...')
    runningApi = await compileAndSpawn()
  })
}

