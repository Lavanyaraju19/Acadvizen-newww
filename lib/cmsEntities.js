const ENTITY_CONFIGS = {
  pages: {
    table: 'pages',
    contentType: 'page',
    slugField: 'slug',
    statusField: 'status',
    visibilityField: 'is_active',
    compatibilityVisibilityFields: ['is_published'],
    orderField: 'updated_at',
    ascending: false,
    allowedFields: [
      'title', 'slug', 'status', 'description', 'seo_title', 'seo_description',
      'og_image', 'canonical_url', 'noindex', 'content',
      'sections_json', 'page_template_id', 'parent_id', 'order_index',
      'is_active', 'is_published', 'published_at',
      'scheduled_publish_at', 'scheduled_unpublish_at',
    ],
  },
  blogs: {
    table: 'blogs',
    contentType: 'blog',
    slugField: 'slug',
    statusField: 'status',
    visibilityField: 'is_active',
    compatibilityVisibilityFields: ['is_published'],
    orderField: 'published_at',
    ascending: false,
    allowedFields: [
      'title', 'slug', 'status', 'description', 'seo_title', 'seo_description',
      'og_image', 'canonical_url', 'noindex', 'content', 'content_json',
      'featured_image', 'image', 'excerpt', 'tags', 'categories',
      'author', 'author_id', 'faq_schema',
      'is_active', 'is_published', 'published_at',
      'scheduled_publish_at', 'scheduled_unpublish_at',
    ],
  },
  courses: {
    table: 'courses',
    contentType: 'course',
    slugField: 'slug',
    visibilityField: 'is_active',
    compatibilityVisibilityFields: ['is_published'],
    orderField: 'order_index',
  },
  tools_extended: {
    table: 'tools_extended',
    contentType: 'tool',
    slugField: 'slug',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  reusable_sections: {
    table: 'reusable_sections',
    contentType: 'reusable_section',
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
    contentType: 'reusable_section',
    slugField: 'slug',
    statusField: 'status',
    orderField: 'order_index',
  },
  page_templates: {
    table: 'page_templates',
    contentType: 'page_template',
    slugField: 'slug',
    visibilityField: 'is_active',
    orderField: 'updated_at',
    ascending: false,
  },
  companies: {
    table: 'companies',
    contentType: 'company',
    slugField: 'slug',
    visibilityField: 'is_active',
    orderField: 'company_name',
  },
  internships: {
    table: 'internships',
    contentType: 'internship',
    slugField: 'slug',
    visibilityField: 'is_active',
    orderField: 'created_at',
    ascending: false,
  },
  locations: {
    table: 'locations',
    contentType: 'location',
    slugField: 'slug',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  roles: {
    table: 'roles',
    slugField: 'slug',
    orderField: 'name',
  },
  authors: {
    table: 'authors',
    slugField: 'slug',
    orderField: 'name',
  },
  blog_categories: {
    table: 'blog_categories',
    slugField: 'slug',
    orderField: 'name',
  },
  blog_tags: {
    table: 'blog_tags',
    slugField: 'slug',
    orderField: 'name',
  },
  testimonials: {
    table: 'testimonials',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  success_stories: {
    table: 'success_stories',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  placements: {
    table: 'placements',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  recruiters: {
    table: 'recruiters',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  instructors: {
    table: 'instructors',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  certifications: {
    table: 'certifications',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  student_metrics: {
    table: 'student_metrics',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  trust_badges: {
    table: 'trust_badges',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  community_events: {
    table: 'community_events',
    visibilityField: 'is_active',
    orderField: 'order_index',
  },
  cta_blocks: {
    table: 'cta_blocks',
    visibilityField: 'is_active',
    orderField: 'created_at',
    ascending: false,
  },
  location_pages: {
    table: 'location_pages',
    contentType: 'location_page',
    slugField: 'slug',
    statusField: 'status',
    orderField: 'updated_at',
    ascending: false,
  },
  lms_modules: {
    table: 'lms_modules',
    orderField: 'order_index',
  },
  lms_lessons: {
    table: 'lms_lessons',
    orderField: 'order_index',
  },
  course_details: {
    table: 'course_details',
    orderField: 'order_index',
  },
  resources: {
    table: 'resources',
    contentType: 'resource',
    slugField: 'slug',
    visibilityField: 'is_active',
    compatibilityVisibilityFields: ['is_published'],
    orderField: 'order_index',
  },
  service_pages: {
    table: 'service_pages',
    contentType: 'service_page',
    slugField: 'slug',
    visibilityField: 'is_active',
    orderField: 'order_index',
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
