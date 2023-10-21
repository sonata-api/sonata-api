export const timestamped = <const>{
  properties: {
    created_at: {
      type: 'string',
      format: 'date-time',
      s$noForm: true,
      readOnly: true
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      s$noForm: true,
      readOnly: true
    }
  }
}