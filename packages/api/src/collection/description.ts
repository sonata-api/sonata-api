import type { Description, SchemaWithId } from '@sonata-api/types'

export const defineDescription = <const TDescription extends Description<TDescription>>(description: Partial<TDescription>) => [{}, description] as unknown as [
  SchemaWithId<TDescription>,
  TDescription
]

export const defineAliasDescription = <const TDescription extends Partial<Description>>(description: TDescription) => {
  return defineDescription(description as any)[1] as TDescription & {
    properties: TDescription['properties'] extends object
      ? TDescription['properties']
      : {}
  }
}
