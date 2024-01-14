import * as presets from '@sonata-api/api/presets'
import { writeFile } from 'fs/promises'
import { collections } from '..'
import path from 'path'
import { extractIcons, iconsContent, iconsDtsContent } from '../utils'

const iconsJson = async () => {
  const base = path.join(process.cwd(), 'dist')
  const icons = []

  for( const collectionName in collections ) {
    const collection = collections[collectionName as keyof typeof collections]
    icons.push(...extractIcons(collection.description))
  }

  for( const presetName in presets ) {
    const preset = presets[presetName as keyof typeof presets]
    icons.push(...extractIcons(preset))
  }

  const uniqueIcons = [
    ...new Set(icons), 
  ]
  await writeFile(path.join(base, 'icons.js'), iconsContent(uniqueIcons))
  await writeFile(path.join(base, 'icons.d.ts'), iconsDtsContent(uniqueIcons))
}

iconsJson()
