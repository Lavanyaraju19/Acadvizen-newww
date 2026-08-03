import { generateSlug, RESERVED_SLUGS, validateSlug } from './slugUtils.js'

export const CMS_STATUSES = ['draft', 'review', 'approved', 'published', 'archived']

export const CMS_CONTENT_TYPES = {
  page: {
    table: 'pages',
    slugField: 'slug',
    statusField: 'status',
    publicStandalone: true,
    routePattern: '/{slug}',
    canonicalPath: (slug) => normalizePagePath(slug),
    listPaths: ['/', '/sitemap.xml'],
    tags: ['cms:pages', 'cms:navigation', 'cms:sitemap', 'cms:homepage'],
  },
  location_page: {
    table: 'location_pages',
    slugField: 'slug',
    statusField: 'status',
    publicStandalone: true,
    routePattern: '/{slug}',
    canonicalPath: (slug) => normalizePagePath(slug),
    listPaths: ['/', '/courses', '/sitemap.xml'],
    tags: ['cms:location-pages', 'cms:navigation', 'cms:sitemap'],
  },
  city_page: {
    table: 'city_pages',
    slugField: 'slug',
    visibilityField: 'is_active',
    publicStandalone: true,
    routePattern: '/digital-marketing-course-in-{city-slug}',
    canonicalPath: (slug) => `/digital-marketing-course-in-${normalizeCmsSlug(slug)}`,
    listPaths: ['/', '/courses', '/sitemap.xml'],
    tags: ['cms:city-pages', 'cms:navigation', 'cms:sitemap'],
  },
  city_course: {
    publicStandalone: true,
    routePattern: '/digital-marketing-course-{city-slug}',
    canonicalPath: (slug) => `/digital-marketing-course-${normalizeCmsSlug(slug)}`,
    listPaths: ['/', '/courses', '/sitemap.xml'],
    tags: ['cms:location-pages', 'cms:sitemap'],
  },
  location_course: {
    publicStandalone: true,
    routePattern: '/digital-marketing-courses-{location-slug}',
    canonicalPath: (slug) => `/digital-marketing-courses-${normalizeCmsSlug(slug)}`,
    listPaths: ['/', '/courses', '/sitemap.xml'],
    tags: ['cms:location-pages', 'cms:sitemap'],
  },
  service_location: {
    publicStandalone: true,
    routePattern: '/{service-slug}-in-{area-slug}',
    canonicalPath: (slug, { parentSlug = '' } = {}) => {
      const normalizedParent = normalizeCmsSlug(parentSlug)
      const normalizedSlug = normalizeCmsSlug(slug)
      return normalizedParent ? `/${normalizedParent}-in-${normalizedSlug}` : normalizePagePath(normalizedSlug)
    },
    listPaths: ['/', '/courses', '/sitemap.xml'],
    tags: ['cms:location-pages', 'cms:sitemap'],
  },
  blog: {
    table: 'blogs',
    slugField: 'slug',
    statusField: 'status',
    publicStandalone: true,
    routePattern: '/blog/{slug}',
    canonicalPath: (slug) => `/blog/${normalizeCmsSlug(slug)}`,
    listPaths: ['/blog', '/', '/sitemap.xml'],
    tags: ['cms:blogs', 'cms:sitemap', 'cms:homepage'],
  },
  blog_category: {
    table: 'blog_categories',
    slugField: 'slug',
    publicStandalone: true,
    routePattern: '/blog/category/{slug}',
    canonicalPath: (slug) => `/blog/category/${normalizeCmsSlug(slug)}`,
    listPaths: ['/blog', '/sitemap.xml'],
    tags: ['cms:blog-categories', 'cms:blogs', 'cms:sitemap'],
  },
  blog_tag: {
    table: 'blog_tags',
    slugField: 'slug',
    publicStandalone: true,
    routePattern: '/blog/tag/{slug}',
    canonicalPath: (slug) => `/blog/tag/${normalizeCmsSlug(slug)}`,
    listPaths: ['/blog', '/sitemap.xml'],
    tags: ['cms:blog-tags', 'cms:blogs', 'cms:sitemap'],
  },
  author: {
    table: 'authors',
    slugField: 'slug',
    publicStandalone: true,
    routePattern: '/blog/author/{slug}',
    canonicalPath: (slug) => `/blog/author/${normalizeCmsSlug(slug)}`,
    listPaths: ['/blog', '/sitemap.xml'],
    tags: ['cms:authors', 'cms:blogs', 'cms:sitemap'],
  },
  course: {
    table: 'courses',
    slugField: 'slug',
    visibilityField: 'is_published',
    publicStandalone: true,
    routePattern: '/courses/{slug}',
    canonicalPath: (slug) => `/courses/${normalizeCmsSlug(slug)}`,
    listPaths: ['/courses', '/', '/sitemap.xml'],
    tags: ['cms:courses', 'cms:sitemap', 'cms:homepage'],
  },
  tool: {
    table: 'tools_extended',
    slugField: 'slug',
    visibilityField: 'is_active',
    publicStandalone: true,
    routePattern: '/tools/{slug}',
    canonicalPath: (slug) => `/tools/${normalizeCmsSlug(slug)}`,
    listPaths: ['/tools', '/', '/sitemap.xml'],
    tags: ['cms:tools', 'cms:sitemap', 'cms:homepage'],
  },
  company: {
    table: 'companies',
    slugField: 'slug',
    visibilityField: 'is_active',
    publicStandalone: true,
    routePattern: '/companies/{slug}',
    canonicalPath: (slug) => `/companies/${normalizeCmsSlug(slug)}`,
    listPaths: ['/companies', '/sitemap.xml'],
    tags: ['cms:companies', 'cms:sitemap'],
  },
  internship: {
    table: 'internships',
    slugField: 'slug',
    visibilityField: 'is_active',
    publicStandalone: true,
    routePattern: '/internships/{slug}',
    canonicalPath: (slug) => `/internships/${normalizeCmsSlug(slug)}`,
    listPaths: ['/internships', '/sitemap.xml'],
    tags: ['cms:internships', 'cms:sitemap'],
  },
  location: {
    table: 'locations',
    slugField: 'slug',
    visibilityField: 'is_active',
    publicStandalone: true,
    routePattern: '/digital-marketing-courses-{slug}',
    canonicalPath: (slug) => `/digital-marketing-courses-${normalizeCmsSlug(slug)}`,
    listPaths: ['/', '/sitemap.xml'],
    tags: ['cms:locations', 'cms:navigation', 'cms:sitemap', 'cms:homepage'],
  },
  resource: {
    table: 'resources',
    slugField: 'slug',
    visibilityField: 'is_active',
    publicStandalone: true,
    routePattern: '/resources/{slug}',
    canonicalPath: (slug) => `/resources/${normalizeCmsSlug(slug)}`,
    listPaths: ['/resources', '/sitemap.xml'],
    tags: ['cms:resources', 'cms:sitemap'],
  },
  service_page: {
    table: 'service_pages',
    slugField: 'slug',
    visibilityField: 'is_active',
    publicStandalone: true,
    routePattern: '/{slug}',
    canonicalPath: (slug) => normalizePagePath(slug),
    listPaths: ['/', '/courses', '/sitemap.xml'],
    tags: ['cms:service-pages', 'cms:navigation', 'cms:sitemap'],
  },
  reusable_section: {
    table: 'reusable_sections',
    slugField: 'slug',
    statusField: 'status',
    publicStandalone: false,
    routePattern: null,
    canonicalPath: () => '/',
    listPaths: ['/'],
    tags: ['cms:sections', 'cms:homepage', 'cms:navigation'],
  },
  page_template: {
    table: 'page_templates',
    slugField: 'slug',
    statusField: 'status',
    publicStandalone: false,
    routePattern: null,
    canonicalPath: () => '/',
    listPaths: ['/'],
    tags: ['cms:templates'],
  },
  homepage_section: {
    publicStandalone: false,
    routePattern: '/',
    canonicalPath: () => '/',
    listPaths: ['/'],
    tags: ['cms:homepage'],
  },
  navigation: {
    publicStandalone: false,
    routePattern: null,
    canonicalPath: () => '/',
    listPaths: ['/'],
    tags: ['cms:navigation', 'cms:homepage'],
  },
}

const OPTIONAL_PUBLIC_FILTERS = new Set(['deleted_at', 'published_at', 'scheduled_publish_at', 'scheduled_unpublish_at'])

export class CmsPublicQueryError extends Error {
  constructor(message, context = {}) {
    super(message)
    this.name = 'CmsPublicQueryError'
    this.context = context
  }
}

export function normalizeCmsStatus(value = 'draft') {
  const normalized = String(value || 'draft').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (normalized === 'in_review' || normalized === 'pending_review') return 'review'
  if (normalized === 'live') return 'published'
  if (normalized === 'unpublished' || normalized === 'deleted') return 'draft'
  if (CMS_STATUSES.includes(normalized)) return normalized
  return 'draft'
}

export function normalizeCmsSlug(value = '') {
  return generateSlug(String(value || '').replace(/^\/+|\/+$/g, ''))
}

export function validateCmsSlug(value = '') {
  const slug = normalizeCmsSlug(value)
  if (!slug) return { valid: false, error: 'Slug is required', slug }
  const validation = validateSlug(slug)
  return { ...validation, slug }
}

export function normalizePagePath(slug = '') {
  const normalized = normalizeCmsSlug(slug)
  if (!normalized || normalized === 'home') return '/'
  return `/${normalized}`
}

export function getCmsContentTypeConfig(contentType = '') {
  return CMS_CONTENT_TYPES[String(contentType || '').trim()] || null
}

function normalizeCustomPublicPath(value = '') {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      return normalizeCustomPublicPath(`${parsed.pathname}${parsed.search || ''}`)
    } catch {
      return ''
    }
  }
  const path = `/${raw.replace(/^\/+|\/+$/g, '')}`
    .replace(/\/{2,}/g, '/')
    .replace(/\s+/g, '-')
    .toLowerCase()
  if (path.includes('/undefined') || path.includes('/null')) return ''
  const firstSegment = path.split('/').filter(Boolean)[0] || ''
  if (RESERVED_SLUGS.has(firstSegment)) return ''
  return path === '/home' ? '/' : path
}

export function resolveCmsPublicRoute({
  contentType,
  slug = '',
  parentSlug = '',
  category = '',
  city = '',
  area = '',
  location = '',
  customUrl = '',
} = {}) {
  const config = getCmsContentTypeConfig(contentType)
  const customPath = normalizeCustomPublicPath(customUrl)
  if (customPath) return customPath

  const normalizedSlug = normalizeCmsSlug(slug || city || area || location || category)
  const normalizedParentSlug = normalizeCmsSlug(parentSlug)
  const normalizedCity = normalizeCmsSlug(city || slug)
  const normalizedLocation = normalizeCmsSlug(location || area || slug)

  if (!config) return normalizePagePath(normalizedSlug)

  switch (contentType) {
    case 'city_page':
      return `/digital-marketing-course-in-${normalizedCity}`
    case 'location_course':
      return `/digital-marketing-courses-${normalizedLocation}`
    case 'city_course':
      return `/digital-marketing-course-${normalizedCity}`
    case 'service_location':
      return normalizedParentSlug && normalizedLocation ? `/${normalizedParentSlug}-in-${normalizedLocation}` : normalizePagePath(normalizedSlug)
    default:
      return config.canonicalPath(normalizedSlug, { parentSlug: normalizedParentSlug })
  }
}

export function getCanonicalPath(contentType, slug, options = {}) {
  return resolveCmsPublicRoute({ contentType, slug, ...options })
}

export function getCmsRouteMap() {
  return Object.entries(CMS_CONTENT_TYPES).map(([contentType, config]) => ({
    contentType,
    table: config.table || null,
    slugField: config.slugField || null,
    statusField: config.statusField || null,
    visibilityField: config.visibilityField || null,
    publicStandalone: Boolean(config.publicStandalone),
    routePattern: config.routePattern,
    listPaths: config.listPaths || [],
    tags: config.tags || [],
  }))
}

export function getLegacyLocationRoutePatterns() {
  return [
    { contentType: 'city_course', routePattern: '/digital-marketing-course-{city-slug}' },
    { contentType: 'location_course', routePattern: '/digital-marketing-courses-{location-slug}' },
    { contentType: 'service_location', routePattern: '/{service-slug}-in-{area-slug}' },
  ]
}

export function getCanonicalPathLegacy(contentType, slug) {
  const config = getCmsContentTypeConfig(contentType)
  if (!config) return normalizePagePath(slug)
  return config.canonicalPath(slug)
}

export function getCanonicalPublicUrl(contentType, slug, baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://acadvizen.com') {
  const cleanBase = String(baseUrl || 'https://acadvizen.com').replace(/\/+$/g, '')
  return `${cleanBase}${getCanonicalPath(contentType, slug)}`
}

export function buildPublishFields({ nextStatus = 'draft', existing = {}, requestedPublishedAt = null } = {}) {
  const status = normalizeCmsStatus(nextStatus)
  const now = new Date().toISOString()
  const fields = { status }

  if (status === 'published') {
    fields.published_at = existing?.published_at || requestedPublishedAt || now
  } else if (status === 'draft' || status === 'archived') {
    fields.published_at = null
  } else if (requestedPublishedAt) {
    fields.published_at = requestedPublishedAt
  }

  return fields
}

export function buildVisibilityFields({ isPublished = false, field = 'is_published' } = {}) {
  return {
    [field]: Boolean(isPublished),
  }
}

export async function assertSlugAvailable(supabase, {
  table,
  slug,
  slugField = 'slug',
  currentId = '',
  contentType = 'content',
} = {}) {
  if (!supabase) throw new Error('Supabase client is unavailable.')
  const normalizedSlug = normalizeCmsSlug(slug)
  const validation = validateCmsSlug(normalizedSlug)
  if (!validation.valid) {
    const error = new Error(validation.error)
    error.status = 400
    throw error
  }

  let query = supabase.from(table).select('id').eq(slugField, normalizedSlug).limit(1)
  if (currentId) query = query.neq('id', currentId)
  const { data, error } = await query.maybeSingle()
  if (error) {
    throw new Error(`Failed to validate ${contentType} slug: ${error.message}`)
  }
  if (data?.id) {
    const conflict = new Error(`A ${contentType} with slug "${normalizedSlug}" already exists.`)
    conflict.status = 409
    throw conflict
  }
  return normalizedSlug
}

function dedupe(values = []) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

export function getCmsCacheTargets(contentType, { slug = '', previousSlug = '', extraPaths = [], extraTags = [] } = {}) {
  const config = getCmsContentTypeConfig(contentType) || CMS_CONTENT_TYPES.page
  const paths = [
    ...config.listPaths,
    slug ? config.canonicalPath(slug) : '',
    previousSlug ? config.canonicalPath(previousSlug) : '',
    ...extraPaths,
  ].filter((path) => path && path.startsWith('/'))

  const tags = [
    ...config.tags,
    slug ? `${config.tags[0] || `cms:${contentType}`}:${normalizeCmsSlug(slug)}` : '',
    previousSlug ? `${config.tags[0] || `cms:${contentType}`}:${normalizeCmsSlug(previousSlug)}` : '',
    ...extraTags,
  ]

  return {
    paths: dedupe(paths),
    tags: dedupe(tags),
  }
}

export function buildCmsMutationMeta(contentType, record = {}, revalidation = null) {
  const slug = normalizeCmsSlug(record?.slug || '')
  const status = normalizeCmsStatus(record?.status || (record?.is_active || record?.is_published ? 'published' : 'draft'))
  return {
    id: record?.id || null,
    content_type: contentType,
    slug,
    canonical_path: slug ? getCanonicalPath(contentType, slug) : null,
    canonical_public_url: slug ? getCanonicalPublicUrl(contentType, slug) : null,
    status,
    published_at: record?.published_at || null,
    updated_at: record?.updated_at || null,
    revalidation,
  }
}

function isMissingColumnError(error) {
  const message = String(error?.message || '').toLowerCase()
  if (!message.includes('does not exist')) return ''
  for (const column of OPTIONAL_PUBLIC_FILTERS) {
    if (message.includes(column)) return column
  }
  return ''
}

function isMissingTableError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.code === 'PGRST205' ||
    message.includes('could not find the table') ||
    message.includes('relation') && message.includes('does not exist')
  )
}

function logCmsPublic(level, message, context = {}) {
  const safeContext = {
    content_type: context.contentType,
    table: context.table,
    record_id: context.recordId,
    slug: context.slug,
    requested_route: context.requestedRoute,
    publish_status: context.status,
    supabase_error_code: context.errorCode,
    reason: context.reason,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  }
  const writer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  writer('[cms-public]', message, safeContext)
}

function buildPublicQuery(supabase, table, slugField, slug, filters, select = '*') {
  let query = supabase.from(table).select(select).eq(slugField, slug).limit(1)
  for (const filter of filters) {
    if (filter.type === 'eq') query = query.eq(filter.column, filter.value)
    if (filter.type === 'is') query = query.is(filter.column, filter.value)
    if (filter.type === 'lte') query = query.lte(filter.column, filter.value)
    if (filter.type === 'or') query = query.or(filter.value)
  }
  return query
}

// Mirrors the OR-filters already applied at the SQL level in fetchPublishedRecordBySlug
// (published_at is.null OR lte.now, scheduled_publish_at is.null OR lte.now, scheduled_unpublish_at
// is.null OR gt.now): a record is visible unless something explicitly says otherwise, rather than
// requiring published_at to be set. Content types with no statusField (city_page, tool, course) are
// gated purely by visibilityField and never have their admin APIs set published_at, so requiring it
// here made every such record permanently invisible on its public route despite being active.
function isRecordPubliclyVisible(record, { preview = false, statusField = '', visibilityField = '' } = {}) {
  if (preview) return true
  if (record?.deleted_at) return false
  if (visibilityField && record?.[visibilityField] === false) return false

  if (statusField) {
    const statusValue = String(record?.[statusField] || '').trim().toLowerCase()
    if (statusValue !== 'published' && statusValue !== 'live' && statusValue !== 'approved') return false
  }

  if (record?.published_at) {
    const publishedAt = new Date(record.published_at)
    if (!Number.isNaN(publishedAt.getTime()) && publishedAt > new Date()) return false
  }

  if (record?.scheduled_publish_at) {
    const scheduledPublishAt = new Date(record.scheduled_publish_at)
    if (!Number.isNaN(scheduledPublishAt.getTime()) && scheduledPublishAt > new Date()) return false
  }

  if (record?.scheduled_unpublish_at) {
    const scheduledUnpublishAt = new Date(record.scheduled_unpublish_at)
    if (!Number.isNaN(scheduledUnpublishAt.getTime()) && scheduledUnpublishAt <= new Date()) return false
  }

  return true
}

export async function fetchPublishedRecordBySlug(supabase, {
  table,
  slug,
  slugField = 'slug',
  statusField = 'status',
  visibilityField = '',
  contentType = 'content',
  requestedRoute = '',
  select = '*',
  preview = false,
} = {}) {
  const normalizedSlug = normalizeCmsSlug(slug)
  if (!supabase || !normalizedSlug) return null

  const now = new Date().toISOString()
  const baseFilters = []
  if (!preview) {
    if (statusField) baseFilters.push({ type: 'eq', column: statusField, value: 'published' })
    if (visibilityField) baseFilters.push({ type: 'eq', column: visibilityField, value: true })
    baseFilters.push({ type: 'is', column: 'deleted_at', value: null })
    baseFilters.push({ type: 'or', column: 'published_at', value: `published_at.is.null,published_at.lte.${now}` })
    baseFilters.push({ type: 'or', column: 'scheduled_publish_at', value: `scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}` })
    baseFilters.push({ type: 'or', column: 'scheduled_unpublish_at', value: `scheduled_unpublish_at.is.null,scheduled_unpublish_at.gt.${now}` })
  }

  const filterStrategies = []
  filterStrategies.push(baseFilters)

  if (!preview) {
    const reducedFilters = baseFilters.filter((filter) => !['published_at', 'scheduled_publish_at', 'scheduled_unpublish_at'].includes(filter.column))
    filterStrategies.push(reducedFilters)
    filterStrategies.push([])
  }

  for (const filters of filterStrategies) {
    const { data, error } = await buildPublicQuery(supabase, table, slugField, normalizedSlug, filters, select)
    if (!error) {
      const record = Array.isArray(data) ? data[0] : null
      if (!record) {
        if (filters.length === 0) {
          logCmsPublic('info', 'No public CMS record matched the requested route.', {
            contentType,
            table,
            slug: normalizedSlug,
            requestedRoute,
            reason: preview ? 'no_matching_slug' : 'no_matching_published_slug_or_blocked_by_rls',
          })
        }
        continue
      }

      if (!preview && !isRecordPubliclyVisible(record, { preview, statusField, visibilityField })) {
        continue
      }

      return record
    }

    const missingColumn = isMissingColumnError(error)
    if (missingColumn) {
      const previousLength = filters.length
      const nextFilters = filters.filter((filter) => filter.column !== missingColumn)
      if (nextFilters.length !== previousLength) {
        filterStrategies.push(nextFilters)
        continue
      }
    }

    if (isMissingTableError(error)) {
      logCmsPublic('warn', 'CMS public table is unavailable; continuing without this content type.', {
        contentType,
        table,
        slug: normalizedSlug,
        requestedRoute,
        errorCode: error?.code,
        reason: error?.message,
      })
      return null
    }

    if (filters.length === 0) {
      logCmsPublic('error', 'CMS public query failed.', {
        contentType,
        table,
        slug: normalizedSlug,
        requestedRoute,
        errorCode: error?.code,
        reason: error?.message,
      })
      throw new CmsPublicQueryError(`Failed to fetch public ${contentType}: ${error.message}`, {
        contentType,
        table,
        slug: normalizedSlug,
        requestedRoute,
        code: error?.code,
      })
    }
  }

  logCmsPublic('info', 'No public CMS record matched the requested route.', {
    contentType,
    table,
    slug: normalizedSlug,
    requestedRoute,
    reason: preview ? 'no_matching_slug' : 'no_matching_published_slug_or_blocked_by_rls',
  })
  return null
}

export async function resolvePublicCmsRecordBySlug(supabase, {
  slug,
  contentTypes = ['page', 'location_page', 'city_page'],
  requestedRoute = '',
  select = '*',
  preview = false,
} = {}) {
  const normalizedSlug = normalizeCmsSlug(slug)
  if (!supabase || !normalizedSlug) return null

  const candidates = Array.isArray(contentTypes) && contentTypes.length ? contentTypes : ['page']
  for (const contentType of candidates) {
    const config = getCmsContentTypeConfig(contentType)
    if (!config?.table) continue

    const record = await fetchPublishedRecordBySlug(supabase, {
      table: config.table,
      slug: normalizedSlug,
      slugField: config.slugField || 'slug',
      statusField: config.statusField || '',
      visibilityField: config.visibilityField || '',
      contentType,
      requestedRoute,
      select,
      preview,
    })

    if (record) {
      return {
        contentType,
        table: config.table,
        config,
        record,
      }
    }
  }

  return null
}
