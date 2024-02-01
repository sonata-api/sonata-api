import { defineDescription } from '@sonata-api/api'

const link = (_id: string) => {
  return `${process.env.API_URL}/file/${_id}`
}

const timestamp = (lastModified: Date | undefined) => lastModified
  ? new Date(lastModified).getTime()
  : 'fresh'

export const description = defineDescription({
  $id: 'file',
  owned: 'always',
  presets: ['owned'],
  required: [
    'size',
    'last_modified',
    'filename',
    'mime',
  ],
  indexes: [
    'filename',
    'link',
    'mime',
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
      format: 'date-time',
    },
    filename: {
      type: 'string',
    },
    absolute_path: {
      type: 'string',
    },
    relative_path: {
      type: 'string',
    },
    immutable: {
      type: 'boolean',
    },
    link: {
      getter: (value: any) => {
        return `${link(value._id)}/${timestamp(value.last_modified)}`
      },
    },
    download_link: {
      getter: (value: any) => {
        return `${link(value._id)}/download/${timestamp(value.last_modified)}`
      },
    },
  },
  actions: {
    deleteAll: {
      name: 'Remover',
      ask: true,
      selection: true,
    },
  },
  individualActions: {
    remove: {
      name: 'Remover',
      icon: 'trash',
      ask: true,
    },
  },
})