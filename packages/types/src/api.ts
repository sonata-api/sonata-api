import type {
  ObjectId,
  Context,
  Description,
  NonCircularDescription,
  SecurityPolicy,
  AccessControl,
  PackReferences

} from '.'

export type CollectionBase<TCollection extends Collection | NonCircularCollection> = {
  item?: any
  security?: SecurityPolicy
  accessControl?: AccessControl<TCollection>
}

export type Collection<TCollection extends Collection = any> = CollectionBase<TCollection> & {
  description: Description
  functions?: Record<string, (payload: any, context: Context, ...args: any[])=> any>
}

export type NonCircularCollection<TCollection extends NonCircularCollection = any> = CollectionBase<TCollection> & {
  description: NonCircularDescription
  functions?: Record<string, (...args: any[]) => any>
}

export type AssetType = keyof Collection
export type FunctionPath = `${string}@${string}`

export type UserACProfile = {
  readonly roles: string[]
  readonly allowed_functions?: string[]
}

export type DecodedToken =
  | {
    authenticated: true
    user: PackReferences<Collections['user']['item']> & {
      _id: ObjectId
      roles: string[]
    }
    extra?: Record<string, any>
    allowed_functions?: FunctionPath[]
    key_id?: string
    key_name?: string
  }
  | {
    authenticated: false
    user: {
      _id: null
    }
  }

