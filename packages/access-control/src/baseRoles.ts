export const baseRoles = <const>{
  authenticated: {
    capabilities: {
      meta: {
        functions: [
          'describe'
        ]
      },
      file: {
        forbidEverything: true,
        functions: [
          'download'
        ]
      },
      user: {
        functions: [
          'insert',
          'authenticate',
          'upload'
        ]
      }
    }
  },
  unauthenticated: {
    capabilities: {
      meta: {
        functions: [
          'describe'
        ]
      },
      file: {
        functions: [
          'download'
        ]
      },
      user: {
        functions: [
          'createAccount',
          'authenticate',
          'activate',
          'getInfo'
        ]
      }
    }
  }
}
