declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<
      | 'MONGODB_URI'
      | 'APPLICATION_SECRET',
    string
    > {}
  }
}
