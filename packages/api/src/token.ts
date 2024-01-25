import { promisify } from 'util'
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'

const asyncSign = promisify<string | object | Buffer, Secret, SignOptions>(jwt.sign)
const asyncVerify = promisify<string, Secret, any>(jwt.verify)

export const EXPIRES_IN = 36000

export const signToken = (_payload: Record<string, any>, secret?: string | null, options?: SignOptions) => {
  const { APPLICATION_SECRET } = process.env
  const payload = Object.assign({}, _payload)

  delete payload.iat
  delete payload.exp

  const signed = asyncSign(payload, secret || APPLICATION_SECRET!, options || {
    expiresIn: EXPIRES_IN,
  }) as unknown

  return signed as Promise<string>
}

export const verifyToken = async (token: string, secret?: string) => {
  const { APPLICATION_SECRET } = process.env
  return asyncVerify(token, secret || APPLICATION_SECRET!)
}

export const decodeToken = (token: string, secret?: string) => {
  return verifyToken(token, secret)
}
