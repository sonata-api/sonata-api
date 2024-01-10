import ts from 'typescript'
import path from 'path'
import { readFile } from 'fs/promises'
import { deepMerge } from '@sonata-api/common'
import { log } from './log'

export const compile = async (fileList: string[]) => {
  const tsConfig = JSON.parse((await readFile(`${process.cwd()}/tsconfig.json`)).toString()) as {
    extends?: string
    include?: string[]
    exclude?: string[]
  } & typeof import('./config/tsconfig.json')

  if( tsConfig.extends ) {
    const resolvedPath = require.resolve(path.join(process.cwd(), tsConfig.extends))

    Object.assign(tsConfig, deepMerge(
      tsConfig,
      JSON.parse((await readFile(resolvedPath)).toString())
    ))
  }

  const compilerOptions = tsConfig.compilerOptions as unknown

  const selectedFiles = fileList.filter((file) => {
    const testFile = (exp: string) => new RegExp(exp.replace('*', '([^\/]+)'), 'g').test(file)
    if( tsConfig.include ) {
      return tsConfig.include.some(testFile)
    }

    if( tsConfig.exclude ) {
      return !tsConfig.exclude.some(testFile)
    }

    return true
  })

  const program = ts.createProgram(selectedFiles, compilerOptions as ts.CompilerOptions)
  const emitResult = program.emit()

  const diagnostics = ts.getPreEmitDiagnostics(program)

  if( diagnostics.length ) {
    diagnostics.forEach((diagnostic) => {
      if( diagnostic.file ) {
        const { line, character } = ts.getLineAndCharacterOfPosition(
          diagnostic.file,
          diagnostic.start!
        )

        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        log('error', `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
        return
      }

      log('error', ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    })

    log('error', `${diagnostics.length} errors found`)
  }


  if( emitResult.emitSkipped ) {
    return {
      success: false,
      diagnostics: diagnostics
    }
  }

  return {
    success: true,
    program
  }
}
