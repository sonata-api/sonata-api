export const baba = 1
// import { model as mongooseModel, Model, Schema, SchemaOptions } from 'mongoose'
// import type { Description, CollectionProperty } from '@sonata-api/types'
// import type { Schema as CollectionSchema } from './schema.types'
// import { getReferencedCollection, unsafe } from '@sonata-api/common'

// import { options as defaultOptions } from '../database'
// import { getResourceAsset } from '../assets'
// import { preloadDescription, applyPreset } from './preload'
// import { getTypeConstructor } from './typemapping'


// type SchemaStructure = Record<Lowercase<string>, Record<string, any>>

// /** This static array is populated only once on the warmup with the name of the
//  * collections cast with mongoose.model. It is the simplest way to avoid
//  * circular dependencies in-between the descriptionToSchemaObj() reference
//  * casting and the createModel() return statement.
//  */
// const __loadedModels: Array<string> = []

// export const descriptionToSchemaObj = async (description: Omit<Description, '$id'>) => {
//   let hasRefs = false

//   const convert = async (a: any, [propertyName, property]: [Lowercase<string>, CollectionProperty]) => {
//     if( property.s$meta ) {
//       return a
//     }

//     const type = await getTypeConstructor(property, (description) => descriptionToSchema(description, { _id: false }))
//     const containedType = Array.isArray(type) && type.length === 1
//       ? type[0]
//       : type

//     if( containedType[0] === Object ) {
//       return {
//         ...await a,
//         [propertyName]: Array.isArray(type) && Array.isArray(type[0])
//           ? [containedType[1]]
//           : containedType[1]
//       }
//     }

//     const {
//       $ref: referencedCollection,
//       ...reference
//     } = getReferencedCollection(property)||{} as CollectionProperty

//     const required = property.type !== 'boolean'
//       && (!description.required || description.required.includes(propertyName))

//     const result: Record<string, any> = {
//       type: String,
//       unique: property.s$unique === true,
//       default: (() => {
//         if( property.default ) {
//           return property.default
//         }

//         if( property.type === 'array' ) {
//           return []
//         }
//       })(),
//       required
//     }

//     if( property.s$hidden ) {
//       result.select = false
//     }

//     result.type = type[0] === Map
//       ? type[0]
//       : type

//     if( type[0] === Map ) {
//       result.of = type[1]
//     }

//     if( typeof referencedCollection === 'string' ) {
//       const referenceDescription = unsafe(await getResourceAsset(referencedCollection as keyof Collections, 'description'), `${referencedCollection} description at ${(<any>description).$id}.${propertyName}`)
//       hasRefs = true

//       const actualReferenceName = result.ref = referenceDescription.alias || referenceDescription.$id
//       if( !__loadedModels.includes(actualReferenceName) ) {
//         await getResourceAsset(actualReferenceName as keyof Collections, 'model')
//         __loadedModels.push(actualReferenceName)
//       }

//       if( !property.s$preventPopulate ) {
//         const join = (value: string|Array<string>) => Array.isArray(value)
//           ? value.join(' ')
//           : value

//         result.autopopulate = {
//           maxDepth: (() => {
//             if( reference.s$maxDepth === 0 ) {
//               return 10
//             }

//             return reference.s$maxDepth || 2
//           })(),
//           select: reference.s$select && join(reference.s$select.slice())
//         }
//       }
//     }

//     if( property.enum ) {
//       result.enum = property.enum
//     }

//     return {
//       ...await a,
//       [propertyName]: result
//     }
//   }

//   if( !description.properties ) {
//     throw new TypeError(
//       `description doesnt have properties set`
//     )
//   }

//   if( description.presets ) {
//     description.properties = description.presets?.reduce((a, presetName) => {
//       return applyPreset(a, presetName, 'properties')

//     }, description.properties)
//   }

//   const schemaStructure = await (Object.entries(description.properties) as Array<[Lowercase<string>, CollectionProperty]>)
//     .reduce(convert, {})

//   return {
//     schemaStructure,
//     hasRefs
//   }
// }

// export const descriptionToSchema = async <T>(
//   description: Omit<Description, '$id'> & {
//     $id?: Description['$id']
//   },
//   options: SchemaOptions = {},
//   cb?: ((structure: SchemaStructure) => void)|null
// ) => {
//   const {
//     schemaStructure,
//     hasRefs

//   } = await descriptionToSchemaObj(description)

//   if( cb ) {
//     cb(schemaStructure)
//   }

//   // SchemaOptions type is broken in Mongoose 7
//   // will remove "as any" when possible
//   const schema = new Schema<T>(schemaStructure, options as any)

//   if( description.$id ) {
//     if( hasRefs ) {
//       schema.plugin(require('mongoose-autopopulate'))
//     }

//     schema.plugin(require('mongoose-lean-getters'))
//     schema.plugin(require('mongoose-lean-virtuals'))
//   }

//   return schema
// }

// export const createModel = async <TDescription extends Description>(
//   _description: TDescription,
//   config?: {
//     options?: SchemaOptions|null,
//     modelCallback?: ((structure: SchemaStructure) => void|Promise<void>)|null,
//     schemaCallback?: (schema: Schema<CollectionSchema<TDescription>>) => void|Promise<void>
//   }
// ) => {
//   if( process.env.SONATA_API_SHALLOW_IMPORT ) {
//     return {} as Model<CollectionSchema<TDescription>>
//   }

//   const connections = global.sonataapi__Connections
//   const description = await preloadDescription(_description)

//   const {
//     options,
//     modelCallback,
//     schemaCallback
//   } = config||{}

//   const modelName = description.$id.split('/').pop()!
//   if( connections.default.models[modelName] ) {
//     return connections.default.models[modelName] as Model<CollectionSchema<TDescription>>
//   }

//   if( __loadedModels.includes(modelName) ) {
//     return {} as Model<CollectionSchema<TDescription>>
//   }

//   __loadedModels.push(modelName)
//   const schema = await descriptionToSchema<CollectionSchema<TDescription>>(description, options || defaultOptions, modelCallback)

//   const cascadingDelete: Array<{
//     propertyName: Lowercase<string>
//     collectionName: string
//     array: boolean
//   }> = []

//   for( const [propertyName, property] of Object.entries(description.properties) as Array<[Lowercase<string>, CollectionProperty]> ) {
//     if( property.s$isFile || property.s$inline ) {
//       const referenceDescription = unsafe(await getResourceAsset(property.s$referencedCollection! as keyof Collections, 'description'), `${property.s$referencedCollection} description at ${modelName}.${propertyName}`)

//       cascadingDelete.push({
//         propertyName,
//         collectionName: referenceDescription.alias || referenceDescription.$id,
//         array: property.type === 'array'
//       })
//     }
//   }

//   const purge = async (doc: any) => {
//     for( const subject of cascadingDelete ) {
//       const model = mongooseModel(subject.collectionName)
//       if( subject.array ) {
//         await model.deleteMany({
//           _id: {
//             $in: doc[subject.propertyName]
//           }
//         })
//         continue
//       }

//       await model.deleteOne({
//         _id: doc[subject.propertyName]
//       })
//     }
//   }

//   if( cascadingDelete.length > 0 ) {
//     const cascadingDeleteProjection = cascadingDelete.reduce((a, { propertyName }) => ({
//       ...a,
//       [propertyName]: 1
//     }), {})

//     schema.post('findOneAndDelete', async function(doc) {
//       await purge(doc)
//     })

//     schema.pre('deleteOne', async function() {
//       const doc = await this.model
//         .findOne(this.getQuery(), cascadingDeleteProjection)
//         .lean()

//       await purge(doc)
//     })

//     schema.pre('deleteMany', async function() {
//       const results = await this.model
//         .find(this.getQuery(), cascadingDeleteProjection)
//         .lean()

//       for( const doc of results ) {
//         await purge(doc)
//       }
//     })
//   }

//   if( schemaCallback ) {
//     await schemaCallback(schema)
//   }

//   return connections.default.model<CollectionSchema<TDescription>>(modelName, schema)
// }

