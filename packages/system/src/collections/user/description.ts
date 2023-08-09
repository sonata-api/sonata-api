import { defineDescription } from '@sonata-api/api'

export type User = Omit<typeof User, 'roles'> & {
  roles: Array<string>
  owner: User
}

export const [User, description] = defineDescription({
  $id: 'user',
  required: [
    'full_name',
    'roles',
    'email'
  ],
  form: [
    'full_name',
    'active',
    'roles',
    'email',
    'phone',
    'picture'
  ],
  indexes: [
    'full_name'
  ],
  properties: {
    full_name: {
      type: 'string'
    },
    first_name: {
      type: 'string',
      s$meta: true
    },
    last_name: {
      type: 'string',
      s$meta: true
    },
    active: {
      type: 'boolean',
    },
    roles: {
      type: 'array',
      items: {
        enum: [],
      },
      s$element: 'select'
    },
    email: {
      type: 'string',
      s$inputType: 'email',
      s$unique: true,
    },
    password: {
      type: 'string',
      s$inputType: 'password',
      s$hidden: true,
    },
    phone: {
      type: 'string',
      s$mask: '(##) #####-####'
    },
    picture: {
      $ref: 'file',
      s$accept: [
        'image/*',
      ]
    },
    group: {
      type: 'string',
    },
    self_registered: {
      type: 'boolean',
      readOnly: true
    },
    resources_usage: {
      type: 'object',
      additionalProperties: {
        $ref: 'resourceUsage'
      },
      s$inline: true
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      s$meta: true
    },
  },
  presets: [
    'crud',
    'view',
    'duplicate'
  ],
  layout: {
    name: 'grid',
    options: {
      title: 'full_name',
      picture: 'picture'
    }
  },
  individualActions: {
    'ui:spawnEdit': {
      name: 'Editar',
      icon: 'edit',
    },
    'route:dashboard-user-changepass': {
      name: 'Mudar senha',
      icon: 'key-skeleton',
      fetchItem: true
    },
    delete: {
      name: 'Remover',
      icon: 'trash-alt',
      ask: true
    }
  },
  icon: 'users-alt',
  filters: [
    'full_name',
    'roles',
    'email',
    'phone'
  ],
  table: [
    'full_name',
    'roles',
    'picture',
    'active',
    'updated_at'
  ],
  tableMeta: [
    'first_name',
    'last_name'
  ],
  formLayout: {
    fields: {
      first_name: {
        span: 3,
      },
      last_name: {
        span: 3
      }
    }
  }
})
