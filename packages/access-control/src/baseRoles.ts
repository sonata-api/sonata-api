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
          'ping',
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
      user: {
        functions: [
          'createAccount',
          'authenticate',
          'ping',
          'activate',
          'getInfo'
        ]
      }
    }
  }
}
