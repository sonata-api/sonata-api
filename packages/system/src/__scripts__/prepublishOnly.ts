import * as presets from '@sonata-api/api/presets'
import { writeFile } from 'fs/promises'
import { collections } from '..'
import path from 'path'

const recurse = (target: any): Array<string> => {
  const foundIcons: Array<string> = []
  if( !target || typeof target !== 'object' ) {
    return []
  }

  if( 's$icon' in target ) {
    foundIcons.push(target.s$icon)
  }

  if( 'icon' in target ) {
    foundIcons.push(target.icon)
  }

  for( const child of Object.values(target) ) {
    foundIcons.push(...recurse(child))
  }

  return [ ...new Set(foundIcons) ]
}

const iconsContent = (icons: Array<string>) => {
  const content = `exports.icons = ${JSON.stringify(icons)};\n`
  return content
}

const dtsContent = (icons: Array<string>) => {
  const types = icons.map((icon) => `  | '${icon}'`)
  const lines = [
    `export type UsedIcons = \n${types.join('\n')};`,
    `export declare const icons: UsedIcons;`
  ]

  return lines.join('\n') + '\n'
}

const writeIconsJson = async () => {
  const base = path.join(process.cwd(), 'dist')
  const icons = []

  for( const collectionName in collections ) {
    const collection = collections[collectionName as keyof typeof collections]()
    icons.push(...recurse(collection.description))
  }

  for( const presetName in presets ) {
    const preset = presets[presetName as keyof typeof presets]
    icons.push(...recurse(preset))
  }

  const uniqueIcons = [ ...new Set(icons) ]
  await writeFile(path.join(base, 'icons.js'), iconsContent(uniqueIcons))
  await writeFile(path.join(base, 'icons.d.ts'), dtsContent(uniqueIcons))
}

writeIconsJson()
