import type { ObjectId } from 'mongoose'

export type UnsetReference = string
export type Reference = ObjectId|UnsetReference|(object & MongoDocument)|undefined

export type MongoDocument = {
  _id?: Reference
  created_at?: Date
  updated_at?: Date
}

export {
  ObjectId
}
