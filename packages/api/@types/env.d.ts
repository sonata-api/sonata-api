declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<
      // used by asset handling
      | 'SONATA_API_SHALLOW_IMPORT'
      // used by database
      | 'MONGODB_URI'
      // used by mailing
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
