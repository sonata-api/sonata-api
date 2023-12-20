import { defineDescriptionTuple } from '@sonata-api/api'

export type ApiKey = typeof ApiKey

export const [ApiKey, description] = defineDescriptionTuple({
  $id: 'apiKey',
  owned: true,
  immutable: [
    'name',
    'content',
    'allowed_functions',
    'content'
  ],
  properties: {
    name: {
      type: 'string'
    },
    content: {
      type: 'string'
    },
    allowed_functions: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    active: {
      type: 'boolean'
    },
    created_at: {
      type: 'string',
      format: 'date-time',
    }
  },
  icon: 'brackets-curly',
  presets: [
    'crud'
  ],
  table: [
    'name',
    'allowed_functions',
    'active',
    'created_at'
  ],
  form: [
    'name',
    'allowed_functions'
  ],
  individualActions: {
    copyContent: {
      name: 'Copiar chave',
      icon: 'copy'
    }
  }
})
