export const owned = <const>{
  properties: {
    owner: {
      $ref: 'user',
      noForm: true
    }
  }
}
