import type { Context } from '@sonata-api/types'
import { readFile } from 'fs/promises'
import { ObjectId } from 'mongodb'
import { left, right } from '@sonata-api/common'
import { description } from './description'

export enum FileReadError {
  DocumentNotFound = 'DOCUMENT_NOT_FOUND',
  FileNotFound = 'FILE_NOT_FOUND',
}

const download = async (_id: string, context: Context<typeof description>) => {
  const file = await context.collection.model.findOne({ _id: new ObjectId(_id) }, {
    absolute_path: 1,
    mime: 1
  })

  try {
    if( !file ) {
      return left(FileReadError.DocumentNotFound)
    }

    const content = await readFile(file.absolute_path!)
    Object.assign(file, {
      content
    })

  } catch( err ) {
    return left(FileReadError.FileNotFound)
  }

  return right(file)
}

export default download
