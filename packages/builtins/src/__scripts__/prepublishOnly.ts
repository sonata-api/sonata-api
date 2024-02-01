import * as presets from '@sonata-api/api/presets'
import { writeFile } from 'fs/promises'
import { collections } from '..'
import path from 'path'
import { extractIcons, iconsEsmContent, iconsCjsContent, iconsDtsContent } from '../utils'

const writeIcons = async () => {
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

  const uniqueIcons = [...new Set(icons)]
  await writeFile(path.join(base, 'icons.mjs'), iconsEsmContent(uniqueIcons))
  await writeFile(path.join(base, 'icons.cjs'), iconsCjsContent(uniqueIcons))
  await writeFile(path.join(base, 'icons.d.ts'), iconsDtsContent(uniqueIcons))
}

writeIcons()
