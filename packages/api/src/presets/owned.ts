export const owned = <const>{
  properties: {
    owner: {
      $ref: 'user',
      s$noForm: true
    }
  }
}
