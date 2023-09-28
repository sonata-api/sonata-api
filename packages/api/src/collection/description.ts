import type { Description } from '@sonata-api/types'
import type { Schema } from './schema'

type PropertyDependent =
  | 'required'
  | 'indexes'

type SchemaProps = 
  | '$id'
  | 'owned'
  | 'required'
  | 'indexes'
  | 'properties'

export const defineDescription = <const TDescription extends Omit<Description<TDescription>, SchemaProps> & {
  [P in Exclude<SchemaProps, 'properties'>]: TDescription[P] extends NonNullable<Description[P]>
    ? P extends PropertyDependent
      ? (TDescription[P] & ReadonlyArray<keyof TDescription['properties']>) | []
      : TDescription[P]
    : Description[P]
} & {
  properties: TDescription['properties'] extends Description['properties']
    ? TDescription['properties']
    : Description['properties']

}>(description: Partial<TDescription>) => [{}, description] as unknown as [
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
