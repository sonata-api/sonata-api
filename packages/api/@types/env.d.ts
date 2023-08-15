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
