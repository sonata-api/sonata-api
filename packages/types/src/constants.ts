export const PAGINATION_PER_PAGE_LIMIT = 150

export const PROPERTY_TYPES = <const>[
  'string',
  'integer',
  'number',
  'boolean',
  'object',
  'array',
]

export const PROPERTY_FORMATS = <const>[
  'date',
  'date-time'
]

export const COLLECTION_PRESETS = <const>[
  'crud',
  'duplicate',
  'delete',
  'deleteAll',
  'owned',
  'timestamped',
  'toggleActive',
  'view',
]

export const STORE_EFFECTS = <const>{
  'ITEM_SET': 'setItem',
  'ITEM_INSERT': 'insertItem',
  'ITEMS_SET': 'setItems',
  'ITEMS_UPDATE': 'updateItems',
  'ITEM_REMOVE': 'removeItem',
}

