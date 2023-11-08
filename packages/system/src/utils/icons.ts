export const extractIcons = (target: Record<string, any>): Array<string> => {
  if( !target || typeof target !== 'object' ) {
    return []
  }

  const foundIcons: Array<string> = []
  const icon = target.s$icon || target.icon

  if( icon ) {
    foundIcons.push(icon)
  }

  for( const child of Object.values(target) ) {
    foundIcons.push(...extractIcons(child))
  }

  return foundIcons
}

export const iconsContent = (icons: Array<string>) => {
  const content = `exports.icons = ${JSON.stringify(icons)};\n`
  return content
}

export const iconsDtsContent = (icons: Array<string>) => {
  const types = icons.map((icon) => `  | '${icon}'`)
  const lines = [
    `export type UsedIcons = \n${types.join('\n')};`,
    `export declare const icons: UsedIcons;`
  ]

  return lines.join('\n') + '\n'
}

