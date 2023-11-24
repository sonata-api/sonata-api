import { defineDescription } from '@sonata-api/api'
import type { ResourceUsage } from '../resourceUsage/description'

export type User = Omit<typeof User, 'roles' | 'resources_usage'> & {
  roles: string[]
  resources_usage: Map<string, typeof ResourceUsage>
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
  freshItem: {
    active: true
  },
  properties: {
    full_name: {
      type: 'string'
    },
    first_name: {
      type: 'string',
      getter: (document: any) => {
        return `${document.full_name?.split(' ')[0] || 'N/A'}`
      }
    },
    last_name: {
      type: 'string',
      getter: (document: any) => {
        return `${document.full_name?.split(' ')[1]}`
      }
    },
    active: {
      type: 'boolean',
    },
    roles: {
      type: 'array',
      items: {
        enum: [],
      }
    },
    email: {
      type: 'string',
      inputType: 'email',
      unique: true,
    },
    password: {
      type: 'string',
      inputType: 'password',
      hidden: true,
    },
    phone: {
      type: 'string',
      mask: '(##) #####-####'
    },
    picture: {
      $ref: 'file',
      accept: [
        'image/*',
      ],
      populate: [
        'owner'
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
        $ref: 'resourceUsage',
        inline: true
      },
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
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
      badge: 'roles',
      picture: 'picture',
      information: 'email',
      active: 'active',
      translateBadge: true
    }
  },
  individualActions: {
    'ui:spawnEdit': {
      name: 'Editar',
      icon: 'edit',
    },
    'route:/dashboard/user/changepass': {
      name: 'Mudar senha',
      icon: 'key-skeleton',
      fetchItem: true
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
    'email'
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
