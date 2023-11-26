import type { Description } from '@sonata-api/types'
import type { Schema } from './schema'

export const defineDescription = <const TDescription extends Description<TDescription>>(description: Partial<TDescription>) => [{}, description] as unknown as [
  Schema<TDescription>,
  TDescription
]

export const defineAliasDescription = <TDescription extends Partial<Description>>(description: TDescription) => {
  return defineDescription(description as any)[1] as TDescription & {
    properties: TDescription['properties'] extends object
      ? TDescription['properties']
      : {}
  }
}
