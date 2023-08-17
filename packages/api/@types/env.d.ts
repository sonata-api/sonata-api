declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<
      | 'SONATA_API_SHALLOW_IMPORT'
      | 'MONGODB_URI',
    string
    > {}
  }
}