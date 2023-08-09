import type { createTransport } from 'nodemailer'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<
      | 'MAILING_SMTP_HOST'
      | 'MAILING_SMTP_PORT'
      | 'MAILING_SMTP_USERNAME'
      | 'MAILING_SMTP_PASSWORD'
      | 'MAILING_SMTP_TRANSACTIONAL_SENDER_NAME'
      | 'MAILING_SMTP_TRANSACTIONAL_SENDER_EMAIL',
    string
    > {}
  }
}

const __cached: {
  transporter?: ReturnType<typeof createTransport>
} = {}

export enum MailingErrors {
  DependencyMissing = 'DEPENDENCY_MISSING'
}

export type TransactionalEmail = {
  senderEmail?: string
  senderName?: string
  receiverEmail: string
  receiverName: string
  subject: string
  html: string
}

export const getMailingTransporter = async () => {
  try {
    if( __cached.transporter ) {
      return right(__cached.transporter)
    }

    const nodemailer = await import('nodemailer')
    __cached.transporter = nodemailer.createTransport({
      host: process.env.MAILING_SMTP_HOST,
      port: Number(process.env.MAILING_SMTP_PORT),
      auth: {
        user: process.env.MAILING_SMTP_USERNAME,
        pass: process.env.MAILING_SMTP_PASSWORD
      }
    })

    return right(__cached.transporter)

  } catch( err: any ) {
    if( err.code === 'ERR_MODULE_NOT_FOUND' ) {
      return left(MailingErrors.DependencyMissing)
    }

    throw err
  }
}

export const sendTransactionalEmail = async (email: TransactionalEmail) => {
  const transporterEither = await getMailingTransporter()
  if( isLeft(transporterEither) ) {
    return transporterEither
  }

  const transporter = unwrapEither(transporterEither)

  const defaults = {
    senderName: process.env.MAILING_TRANSACTIONAL_SENDER_NAME,
    senderEmail: process.env.MAILING_TRANSACTIONAL_SENDER_EMAIL,
  }

  const fullEmail = Object.assign(defaults, email) as Required<TransactionalEmail> 
  const makeAddress = (name: string, email: string) => `${name} <${email}>`

  await transporter.sendMail({
    from: makeAddress(fullEmail.senderName, fullEmail.senderEmail),
    to: makeAddress(fullEmail.receiverName, fullEmail.receiverEmail),
    subject: fullEmail.subject,
    html: fullEmail.html
  })
  
  return right('ok')
}
