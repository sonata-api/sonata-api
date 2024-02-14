import path from 'path'
import { writeFile } from 'fs/promises'
import * as presets from '../packages/api/dist/presets/index.js'
import * as collections from '../packages/builtins/dist/collections/index.js'
import { extractIcons, iconsEsmContent, iconsCjsContent, iconsDtsContent } from '../packages/sonata-build/dist/index.js'

const writeIcons = async () => {
  const base = path.resolve('./packages/builtins/dist')
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

