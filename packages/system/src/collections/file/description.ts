import { defineDescriptionTuple } from '@sonata-api/api'

const link = (_id: string) => {
  return `${process.env.API_URL}/file/${_id}`
}

const timestamp = (last_modified: Date) => last_modified
  ? new Date(last_modified).getTime()
  : 'fresh'

export type File = typeof File

export const [File, description] = defineDescriptionTuple({
  $id: 'file',
  owned: 'always',
  presets: [
    'owned'
  ],
  required: [
    'size',
    'last_modified',
    'filename',
    'mime'
  ],
  indexes: [
    'filename',
    'link',
    'mime'
  ],
  properties: {
    mime: {
      type: 'string',
    },
    size: {
      type: 'number',
    },
    last_modified: {
      type: 'string',
      format: 'date-time'
    },
    filename: {
      type: 'string',
    },
    absolute_path: {
      type: 'string'
    },
    relative_path: {
      type: 'string'
    },
    immutable: {
      type: 'boolean'
    },
    link: {
      getter: (value: any) => {
        return `${link(value._id)}/download/${timestamp(value.last_modified)}`
      }
    },
    download_link: {
      getter: (value: any) => {
        return `${link(value._id)}/download/${timestamp(value.last_modified)}`
      }
    }
  },
  actions: {
    deleteAll: {
      name: 'Remover',
      ask: true,
      selection: true
    }
  },
  individualActions: {
    remove: {
      name: 'Remover',
      icon: 'trash-alt',
      ask: true
    }
  },
})
