const ENTITY_CONFIGS = {
  courses: {
    table: 'courses',
    slugField: 'slug',
    visibilityField: 'is_published',
    orderField: 'order_index',
  },
  tools_extended: {
    table: 'tools_extended',
    slugField: 'slug',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  reusable_sections: {
    table: 'reusable_sections',
    slugField: 'slug',
    statusField: 'status',
    orderField: 'order_index',
  },
  homepage_settings: {
    table: 'homepage_settings',
    orderField: 'updated_at',
    ascending: false,
  },
  sitemap_settings: {
    table: 'sitemap_settings',
    orderField: 'updated_at',
    ascending: false,
  },
  global_settings: {
    table: 'global_settings',
    orderField: 'updated_at',
    ascending: false,
  },
  reusable_blocks: {
    table: 'reusable_blocks',
    slugField: 'slug',
    statusField: 'status',
    orderField: 'order_index',
  },
  page_templates: {
    table: 'page_templates',
    slugField: 'slug',
    statusField: 'status',
    orderField: 'updated_at',
    ascending: false,
  },
  companies: {
    table: 'companies',
    slugField: 'slug',
    orderField: 'company_name',
  },
  internships: {
    table: 'internships',
    slugField: 'slug',
    statusField: 'status',
    visibilityField: 'is_active',
    orderField: 'created_at',
    ascending: false,
  },
  roles: {
    table: 'roles',
    slugField: 'slug',
    orderField: 'name',
  },
}

const RESERVED_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'deleted_by',
])

export function getEntityConfig(entity = '') {
  return ENTITY_CONFIGS[String(entity || '').trim()] || null
}

export function applyEntityOrdering(query, config = {}) {
  if (!query) return query
  const orderField = config.orderField || 'created_at'
  return query.order(orderField, { ascending: config.ascending !== false })
}

export function sanitizeEntityPayload(payload = {}, config = {}) {
  if (!payload || typeof payload !== 'object') return {}

  const next = {}
  const allowedFields = Array.isArray(config.allowedFields) && config.allowedFields.length
    ? new Set(config.allowedFields)
    : null

  for (const [key, value] of Object.entries(payload)) {
    if (RESERVED_FIELDS.has(key)) continue
    if (key === 'action') continue
    if (allowedFields && !allowedFields.has(key)) continue
    next[key] = value
  }

  return next
}
