// import * as bcrypt from 'bcrypt'
// import type { Schema } from 'mongoose'
// import { createModel } from '@sonata-api/api'
// import { description, type User } from './description'

// export const schemaCallback = <TUser extends User>(schema: Schema<TUser>) => {
//   schema.virtual('first_name').get(function() {
//     return this.full_name?.split(' ')[0] || 'N/A'
//   })

//   schema.virtual('last_name').get(function() {
//     return this.full_name?.split(' ').slice(1).join(' ') || 'N/A'
//   })

//   schema.methods.testPassword = function(candidate: string) {
//     return this.password
//       ? bcrypt.compare(candidate, this.password)
//       : false
//   }
// }

// export default () => createModel(description, {
//   schemaCallback: schemaCallback as any
// })
