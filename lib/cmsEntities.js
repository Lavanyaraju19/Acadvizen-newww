const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export const CMS_ENTITIES = {
  testimonials: {
    table: 'testimonials',
    orderBy: [{ column: 'order_index', ascending: true }, { column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: [
      'name',
      'role',
      'company',
      'quote',
      'message',
      'image_url',
      'video_testimonial_url',
      'student_result',
      'rating',
      'order_index',
      'is_active',
    ],
  },
  placements: {
    table: 'placements',
    orderBy: [{ column: 'created_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: [
      'title',
      'description',
      'role',
      'company',
      'company_name',
      'location',
      'salary',
      'featured_image',
      'is_active',
      'order_index',
    ],
  },
  recruiters: {
    table: 'recruiters',
    orderBy: [{ column: 'order_index', ascending: true }, { column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: ['name', 'logo_url', 'website_url', 'order_index', 'is_active'],
  },
  instructors: {
    table: 'instructors',
    orderBy: [{ column: 'order_index', ascending: true }, { column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: ['name', 'title', 'bio', 'image_url', 'linkedin_url', 'expertise', 'order_index', 'is_active'],
  },
  certifications: {
    table: 'certifications',
    orderBy: [{ column: 'order_index', ascending: true }, { column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: ['name', 'issuer', 'logo_url', 'description', 'order_index', 'is_active'],
  },
  success_stories: {
    table: 'success_stories',
    orderBy: [{ column: 'order_index', ascending: true }, { column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: [
      'name',
      'role',
      'company',
      'summary',
      'image_url',
      'video_url',
      'result_metric',
      'order_index',
      'is_active',
    ],
  },
  student_metrics: {
    table: 'student_metrics',
    orderBy: [{ column: 'order_index', ascending: true }, { column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: ['metric_key', 'label', 'value', 'suffix', 'order_index', 'is_active'],
  },
  trust_badges: {
    table: 'trust_badges',
    orderBy: [{ column: 'order_index', ascending: true }, { column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: ['label', 'icon', 'description', 'order_index', 'is_active'],
  },
  community_events: {
    table: 'community_events',
    orderBy: [{ column: 'event_date', ascending: false }, { column: 'order_index', ascending: true }],
    visibilityField: 'is_active',
    allowedFields: [
      'title',
      'event_type',
      'event_date',
      'location',
      'description',
      'image_url',
      'registration_url',
      'order_index',
      'is_active',
    ],
  },
  cta_blocks: {
    table: 'cta_blocks',
    orderBy: [{ column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: [
      'key',
      'title',
      'description',
      'button_label',
      'button_url',
      'secondary_label',
      'secondary_url',
      'variant',
      'style_json',
      'is_active',
    ],
    slugField: 'key',
  },
  cities: {
    table: 'cities',
    orderBy: [{ column: 'name', ascending: true }],
    visibilityField: 'is_active',
    allowedFields: [
      'name',
      'slug',
      'state',
      'country',
      'meta_title',
      'meta_description',
      'intro_text',
      'highlights',
      'is_active',
    ],
    slugField: 'slug',
  },
  location_pages: {
    table: 'location_pages',
    orderBy: [{ column: 'updated_at', ascending: false }],
    statusField: 'status',
    allowedFields: [
      'city_id',
      'course_slug',
      'slug',
      'title',
      'description',
      'template_slug',
      'sections_json',
      'style_json',
      'seo_title',
      'seo_description',
      'canonical_url',
      'og_image',
      'noindex',
      'status',
    ],
    slugField: 'slug',
  },
  redirects: {
    table: 'redirects',
    orderBy: [{ column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: ['from_path', 'to_path', 'status_code', 'is_active'],
    slugField: 'from_path',
  },
  footer_groups: {
    table: 'footer_groups',
    orderBy: [{ column: 'order_index', ascending: true }],
    visibilityField: 'is_active',
    allowedFields: ['key', 'title', 'order_index', 'is_active'],
    slugField: 'key',
  },
  navigation_menus: {
    table: 'navigation_menus',
    orderBy: [{ column: 'location', ascending: true }, { column: 'order_index', ascending: true }],
    visibilityField: 'is_active',
    allowedFields: ['location', 'title', 'url', 'parent_id', 'target', 'order_index', 'is_active'],
  },
  reusable_blocks: {
    table: 'reusable_blocks',
    orderBy: [{ column: 'updated_at', ascending: false }],
    statusField: 'status',
    allowedFields: ['name', 'type', 'content_json', 'style_json', 'status'],
    slugField: 'name',
  },
  page_templates: {
    table: 'page_templates',
    orderBy: [{ column: 'updated_at', ascending: false }],
    visibilityField: 'is_active',
    allowedFields: ['name', 'slug', 'description', 'page_type', 'sections_json', 'style_json', 'is_active'],
    slugField: 'slug',
  },
  blog_content_blocks: {
    table: 'blog_content_blocks',
    orderBy: [{ column: 'order_index', ascending: true }],
    allowedFields: ['blog_id', 'order_index', 'block_type', 'content_json'],
  },
  authors: {
    table: 'authors',
    orderBy: [{ column: 'updated_at', ascending: false }],
    allowedFields: ['name', 'slug', 'bio', 'avatar'],
    slugField: 'slug',
  },
  blog_categories: {
    table: 'blog_categories',
    orderBy: [{ column: 'name', ascending: true }],
    allowedFields: ['name', 'slug', 'description'],
    slugField: 'slug',
  },
  blog_tags: {
    table: 'blog_tags',
    orderBy: [{ column: 'name', ascending: true }],
    allowedFields: ['name', 'slug'],
    slugField: 'slug',
  },
}

export function getEntityConfig(entityKey) {
  return CMS_ENTITIES[String(entityKey || '').trim().toLowerCase()] || null
}

export function applyEntityOrdering(query, config) {
  const orderBy = Array.isArray(config?.orderBy) ? config.orderBy : []
  if (!orderBy.length) return query.order('updated_at', { ascending: false })
  let next = query
  for (const sort of orderBy) {
    next = next.order(sort.column, { ascending: sort.ascending !== false })
  }
  return next
}

export function sanitizeEntityPayload(input, config) {
  const allowed = Array.isArray(config?.allowedFields) ? config.allowedFields : []
  const payload = {}
  for (const key of allowed) {
    if (!(key in (input || {}))) continue
    payload[key] = input[key]
  }

  const slugField = config?.slugField
  if (slugField && !payload[slugField]) {
    const source = payload.title || payload.name || payload.label || ''
    if (source) payload[slugField] = slugify(source)
  }

  if (config?.statusField && payload[config.statusField]) {
    payload[config.statusField] = payload[config.statusField] === 'published' ? 'published' : 'draft'
  }
  if (config?.visibilityField && config.visibilityField in payload) {
    payload[config.visibilityField] = Boolean(payload[config.visibilityField])
  }
  if ('noindex' in payload) {
    payload.noindex = Boolean(payload.noindex)
  }
  if ('status_code' in payload) {
    const parsed = Number(payload.status_code)
    payload.status_code = Number.isFinite(parsed) && parsed >= 300 ? parsed : 301
  }

  return payload
}
