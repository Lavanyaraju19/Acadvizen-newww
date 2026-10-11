/**
 * Structured Main Website content managed from the WordPress central admin (Acadvizen Master Admin
 * → Main Website). WordPress never touches Supabase itself: it sends a signed request here, this
 * module validates every field, writes the same records Main's own /admin writes, and Main keeps
 * rendering them with its own Next.js components (design unchanged).
 *
 * Pure functions with injected side effects (database, cache, audit), so they are unit-testable.
 *
 * Request: POST, headers X-Acadvizen-Timestamp / X-Acadvizen-Signature over "<ts>.<raw body>" with
 * the shared secret; body { purpose: "content", request_id, op, entity, actor, ... }.
 * The "purpose" field binds the signature to this endpoint: a signed revalidation webhook body can
 * never be replayed here, and the other way round.
 */
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifySignature } from './signature.js'
import { sanitizeRichHtml } from './richHtml.js'
import { MENU_LOCATIONS, fallbackMenuLinks } from '../navigationDefaults.js'

export const CONTENT_API_MAX_BYTES = 512 * 1024
export const WORKFLOW_STATUSES = ['draft', 'review', 'approved', 'published', 'archived']
const MUTATING_OPS = new Set(['save', 'set_status', 'trash', 'restore', 'delete', 'reorder_sections', 'start_draft', 'import_menu_defaults'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const INVALID = Symbol('invalid')

/* Field validators: each returns the clean value, null (empty) or INVALID. ---------------------- */
const text = (max, { required = false } = {}) => (value) => {
  if (value === undefined) return undefined
  if (value === null || value === '') return required ? INVALID : null
  if (typeof value !== 'string' || value.length > max) return INVALID
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim()
}
const bool = () => (value) => (value === undefined ? undefined : typeof value === 'boolean' ? value : INVALID)
const integer = (min, max) => (value) => {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const n = Number(value)
  return Number.isInteger(n) && n >= min && n <= max ? n : INVALID
}
const url = () => (value) => {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string' || value.length > 2000) return INVALID
  return /^https:\/\/[^\s<>"']+$/i.test(value) || /^\/(?!\/)[^\s<>"']*$/.test(value) ? value : INVALID
}
// CSS colours as stored on Main: #hex, rgb()/rgba() (e.g. the header border rgba(255,255,255,0.1)) or transparent.
export const CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+|\d{1,3}%)\s*)?\)|transparent)$/i
const color = () => (value) => (value === undefined ? undefined : value === null || value === '' ? null : CSS_COLOR.test(String(value).trim()) ? String(value).trim() : INVALID)
const isoDate = () => (value) => {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : INVALID
}
const uuid = ({ required = false } = {}) => (value) => (value === undefined ? undefined : value === null || value === '' ? (required ? INVALID : null) : UUID.test(String(value)) ? value : INVALID)
const choice = (values) => (value) => (value === undefined ? undefined : value === null || value === '' ? null : values.includes(value) ? value : INVALID)
// Links in menus and settings: a site path, https, an in-page anchor, mailto: or tel:.
const link = ({ required = false } = {}) => (value) => {
  if (value === undefined) return undefined
  if (value === null || value === '') return required ? INVALID : null
  if (typeof value !== 'string' || value.length > 2000) return INVALID
  const v = value.trim()
  return /^https:\/\/[^\s<>"']+$/i.test(v) || /^\/(?!\/)[^\s<>"']*$/.test(v) || /^#[\w-]*$/.test(v) || /^mailto:[^\s<>"']+$/i.test(v) || /^tel:\+?[\d\s()-]{3,30}$/i.test(v) ? v : INVALID
}
const stringList = (maxItems, maxLength) => (value) => {
  if (value === undefined) return undefined
  if (value === null) return []
  if (!Array.isArray(value) || value.length > maxItems) return INVALID
  const clean = value.map((item) => (typeof item === 'string' && item.trim().length <= maxLength ? item.trim() : INVALID))
  return clean.includes(INVALID) ? INVALID : clean.filter(Boolean)
}
/* Blog blocks: exactly the four block types Main's blog renderer draws. ------------------------- */
function cleanBlogBlocks(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'object' || !Array.isArray(value.blocks) || value.blocks.length > 2000) return INVALID
  const blocks = []
  for (const [index, block] of value.blocks.entries()) {
    const type = block?.block_type
    const c = block?.content_json || {}
    if (type === 'paragraph') {
      const html = sanitizeRichHtml(c.text ?? '', { maxLength: 20000 })
      if (html === null) return INVALID
      blocks.push({ block_type: 'paragraph', content_json: { text: html }, order_index: index })
    } else if (type === 'heading') {
      const level = Number(c.level || 2)
      if (typeof c.text !== 'string' || c.text.length > 500 || ![2, 3, 4].includes(level)) return INVALID
      blocks.push({ block_type: 'heading', content_json: { text: c.text.trim(), level }, order_index: index })
    } else if (type === 'list') {
      const items = stringList(200, 2000)(c.items)
      if (items === INVALID) return INVALID
      blocks.push({ block_type: 'list', content_json: { items: items.map((item) => sanitizeRichHtml(item, { maxLength: 2000 }) || '') }, order_index: index })
    } else if (type === 'image') {
      const src = url()(c.src)
      if (!src || src === INVALID) return INVALID
      blocks.push({ block_type: 'image', content_json: { src, alt: text(500)(c.alt ?? '') ?? '', caption: text(500)(c.caption ?? '') ?? '' }, order_index: index })
    } else {
      return INVALID
    }
  }
  return { blocks }
}

/** Plain text of blog blocks, kept in `content` so reading time and search match the blocks. */
export function blogPlainText(contentJson) {
  const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return (contentJson?.blocks || [])
    .map((b) => (b.block_type === 'list' ? (b.content_json.items || []).map(strip).join('\n') : b.block_type === 'image' ? '' : strip(b.content_json.text)))
    .filter(Boolean)
    .join('\n\n')
}

/* Sections: the section types Main's DynamicSectionRenderer draws (components/sections). --------- */
export const SECTION_TYPES = [
  'hero', 'text_block', 'image_block', 'video_block', 'two_column_layout', 'three_column_layout', 'testimonial', 'faq',
  'gallery', 'cta_banner', 'feature_cards', 'stats_section', 'pricing', 'team', 'lead_form', 'form_embed', 'map',
  'custom_rich_text', 'data_feed', 'location_explorer', 'learner_map',
]
const SECTION_HTML_KEYS = new Set(['html', 'text', 'body', 'answer', 'description'])
// Exactly the style keys Main's sections apply (components/sections/sectionUtils.js).
const oneOf = (values) => (v) => (values.includes(v) ? v : INVALID)
const cssSize = () => (v) => (/^\d+(\.\d+)?(px|rem|em|%)$/.test(String(v)) ? v : INVALID)
const STYLE_KEYS = {
  alignment: oneOf(['left', 'center', 'right']),
  padding: oneOf(['none', 'sm', 'md', 'lg']),
  background_color: color(),
  text_color: color(),
  card_background: color(),
  button_background: color(),
  button_text_color: color(),
  button_border_color: color(),
  button_radius: cssSize(),
  heading_size: oneOf(['sm', 'md', 'lg']),
  text_size: oneOf(['sm', 'md', 'lg']),
  heading_weight: oneOf(['300', '400', '500', '600', '700', '800']),
  body_weight: oneOf(['300', '400', '500', '600']),
  font_family: oneOf(['inter', 'poppins', 'montserrat', 'lato', 'open_sans', 'system']),
  max_width: cssSize(),
}

/** Section content: any JSON the renderer reads, bounded in size and depth; rich-text keys sanitised. */
function cleanSectionContent(value, depth = 0) {
  if (depth > 6) return INVALID
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'string') return value.length > 20000 ? INVALID : value
  if (Array.isArray(value)) {
    if (value.length > 200) return INVALID
    const items = value.map((item) => cleanSectionContent(item, depth + 1))
    return items.includes(INVALID) ? INVALID : items
  }
  if (typeof value === 'object') {
    const out = {}
    for (const [key, item] of Object.entries(value)) {
      if (!/^[a-z][a-z0-9_]{0,40}$/i.test(key)) return INVALID
      let clean = cleanSectionContent(item, depth + 1)
      if (clean === INVALID) return INVALID
      if (typeof clean === 'string' && SECTION_HTML_KEYS.has(key) && /<[a-z]/i.test(clean)) clean = sanitizeRichHtml(clean, { maxLength: 20000 }) ?? ''
      out[key] = clean
    }
    return out
  }
  return INVALID
}

/**
 * Structured JSON (lists of links, settings objects): bounded like section content, rich-text keys
 * sanitised. PHP sends an empty object as [], so an empty list is accepted for object fields.
 */
const json = ({ shape = 'any', maxBytes = 100000 } = {}) => (value) => {
  if (value === undefined) return undefined
  let v = value
  if (v === null) return shape === 'array' ? [] : shape === 'object' ? {} : null
  if (shape === 'object' && Array.isArray(v) && v.length === 0) v = {}
  if (shape === 'array' && !Array.isArray(v)) return INVALID
  if (shape === 'object' && (typeof v !== 'object' || Array.isArray(v))) return INVALID
  const clean = cleanSectionContent(v)
  if (clean === INVALID || JSON.stringify(clean).length > maxBytes) return INVALID
  return clean
}

function cleanSectionStyle(value) {
  if (value === undefined) return undefined
  // An empty list is how PHP encodes an empty object.
  if (value === null || (Array.isArray(value) && value.length === 0)) return {}
  if (typeof value !== 'object' || Array.isArray(value)) return INVALID
  const out = {}
  for (const [key, item] of Object.entries(value)) {
    if (item === null || item === '') continue
    const check = STYLE_KEYS[key]
    if (!check) return INVALID
    const clean = check(item)
    if (clean === INVALID) return INVALID
    out[key] = clean
  }
  return out
}

/* Entities ------------------------------------------------------------------------------------- */
const SEO = {
  seo_title: text(300), seo_description: text(500), canonical_url: url(), noindex: bool(), og_image: url(),
  exclude_from_sitemap: bool(),
}

export const ENTITIES = {
  pages: {
    table: 'pages', contentType: 'page', titleField: 'title', slugField: 'slug', workflow: 'status', softDelete: true,
    visibility: ['is_active', 'is_published'],
    // Main draws a page only from its sections (or, without any, from title + description);
    // pages.content is never rendered, so it is not offered as an editable field.
    fields: { title: text(200, { required: true }), slug: text(120), description: text(2000), ...SEO, scheduled_publish_at: isoDate(), scheduled_unpublish_at: isoDate() },
    list: ['id', 'title', 'slug', 'status', 'updated_at', 'published_at', 'deleted_at', 'scheduled_publish_at', 'draft_of_id'],
  },
  blogs: {
    table: 'blogs', contentType: 'blog', titleField: 'title', slugField: 'slug', workflow: 'status', softDelete: true,
    visibility: ['published', 'is_published', 'is_active'],
    fields: {
      title: text(300, { required: true }), slug: text(160), excerpt: text(1000), description: text(2000), content_json: cleanBlogBlocks,
      featured_image: url(), categories: stringList(20, 100), tags: stringList(40, 60), ...SEO,
      scheduled_publish_at: isoDate(), scheduled_unpublish_at: isoDate(),
    },
    list: ['id', 'title', 'slug', 'status', 'updated_at', 'published_at', 'deleted_at', 'scheduled_publish_at'],
  },
  tools_extended: {
    table: 'tools_extended', contentType: 'tool', titleField: 'name', slugField: 'slug', workflow: 'active', softDelete: true,
    visibility: ['published'],
    fields: { name: text(200, { required: true }), slug: text(120), logo_url: url(), brand_color: color(), category: text(100), description: text(5000), website_url: url() },
    list: ['id', 'name', 'slug', 'is_active', 'category', 'updated_at', 'deleted_at'],
  },
  locations: {
    table: 'locations', contentType: 'location', titleField: 'name', slugField: 'slug', workflow: 'active', softDelete: false,
    visibility: ['published'],
    fields: {
      name: text(200, { required: true }), slug: text(120), meta_title: text(300), meta_description: text(500), intro_text: text(10000),
      why_text: text(10000), demand_text: text(10000), address: text(1000), phone: text(40), whatsapp: text(40), opening_hours: text(500),
      city_id: uuid(), location_type: text(60),
    },
    list: ['id', 'name', 'slug', 'is_active', 'city_id', 'updated_at'],
  },
  cities: {
    table: 'cities', contentType: 'city_page', titleField: 'name', slugField: 'slug', workflow: 'active', softDelete: false,
    visibility: [],
    fields: { name: text(200, { required: true }), slug: text(120), state: text(100), country: text(100), meta_title: text(300), meta_description: text(500), intro_text: text(10000), highlights: stringList(50, 500) },
    list: ['id', 'name', 'slug', 'is_active', 'updated_at'],
  },
  // Site-wide settings and menus. Only the fields the public header, footer and navigation actually
  // draw (src/components/Layout/PublicLayout.jsx, src/components/Navbar.jsx) are editable; the rest
  // of each row is kept as it is. These rows already exist: they are edited, never created or deleted.
  site_settings: {
    table: 'site_settings', contentType: 'navigation', titleField: 'company_name', slugField: null, workflow: 'none', softDelete: false,
    creatable: false, deletable: false, idPattern: /^[a-z0-9_-]{1,60}$/i,
    visibility: [],
    fields: { company_name: text(200), social_links: json(), ui_copy: json({ shape: 'object' }) },
    list: ['id', 'company_name', 'updated_at'],
  },
  header_settings: {
    table: 'header_settings', contentType: 'navigation', titleField: 'announcement_text', slugField: null, workflow: 'none', softDelete: false,
    creatable: false, deletable: false,
    visibility: [],
    fields: {
      announcement_enabled: bool(), announcement_text: text(500), announcement_link: link(), announcement_bg_color: color(), announcement_text_color: color(),
      phone_number: text(60), email_address: text(200), social_items: json({ shape: 'array' }), header_border_color: color(),
    },
    list: ['id', 'announcement_text', 'announcement_enabled', 'updated_at'],
  },
  footer_settings: {
    table: 'footer_settings', contentType: 'navigation', titleField: 'copyright_text', slugField: null, workflow: 'none', softDelete: false,
    creatable: false, deletable: false,
    visibility: [],
    fields: {
      logo_alt: text(200), contact_phone: text(60), contact_email: text(200), contact_address: text(1000), social_items: json({ shape: 'array' }),
      copyright_text: text(500), footer_bg_color: color(), footer_border_color: color(),
    },
    list: ['id', 'copyright_text', 'updated_at'],
  },
  menus: {
    // Shown by the site only when is_active AND status = 'published' (lib/siteCmsServer.js).
    table: 'menus', contentType: 'navigation', titleField: 'title', slugField: null, workflow: 'active', activeStatus: 'status', softDelete: false,
    orderBy: ['menu_location', 'order_index'], filterable: { menu_location: MENU_LOCATIONS },
    visibility: [],
    fields: {
      menu_location: choice(MENU_LOCATIONS), title: text(200, { required: true }), url: link({ required: true }), order_index: integer(0, 10000),
      parent_id: uuid(), target: choice(['_self', '_blank']), desktop_visible: bool(), mobile_visible: bool(),
    },
    list: ['id', 'title', 'url', 'menu_location', 'order_index', 'parent_id', 'target', 'is_active', 'status', 'desktop_visible', 'mobile_visible', 'updated_at'],
  },
  testimonials: {
    // No updated_at column on Main's testimonials table.
    table: 'testimonials', contentType: 'page', titleField: 'name', slugField: null, workflow: 'active', softDelete: false, timestamps: false,
    visibility: ['published'],
    fields: { name: text(200, { required: true }), role: text(200), quote: text(3000), company: text(200), course: text(200), rating: integer(1, 5), image_url: url() },
    list: ['id', 'name', 'role', 'is_active', 'created_at'],
  },
}

/* Request handling ------------------------------------------------------------------------------ */
const reply = (status, body) => ({ status, body })
const readHeader = (headers, name) => (headers && typeof headers.get === 'function' ? headers.get(name) || '' : (headers || {})[name] || '')

function authenticate({ rawBody, headers, config, now }) {
  if (!config.enabled) return reply(503, { ok: false, error: 'content_api_disabled' })
  if (!config.secret || config.secret.length < 32) return reply(503, { ok: false, error: 'not_configured' })
  if (Buffer.byteLength(rawBody || '', 'utf8') > CONTENT_API_MAX_BYTES) return reply(413, { ok: false, error: 'payload_too_large' })
  const verdict = verifySignature({ body: rawBody, timestamp: readHeader(headers, TIMESTAMP_HEADER), signature: readHeader(headers, SIGNATURE_HEADER), secret: config.secret, now })
  if (!verdict.ok) return reply(401, { ok: false, error: verdict.reason })
  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return reply(400, { ok: false, error: 'invalid_json' })
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.purpose !== 'content') return reply(400, { ok: false, error: 'wrong_purpose' })
  if (typeof payload.request_id !== 'string' || !UUID.test(payload.request_id)) return reply(400, { ok: false, error: 'invalid_request_id' })
  return { payload }
}

export const REQUEST_ID_TABLE = 'wordpress_content_requests'

/**
 * Replay protection shared by every server instance: a request id is claimed by inserting it into
 * REQUEST_ID_TABLE (primary key). A second insert of the same id fails with a unique violation.
 * Any other failure answers 'unavailable', so changes are refused rather than accepted unprotected.
 * Rows older than the retention period (far beyond the 5-minute signature window) are pruned now
 * and then.
 */
export function createRequestClaimer(db, { retentionMs = 24 * 60 * 60 * 1000, pruneChance = 0.02, random = Math.random, clock = Date.now } = {}) {
  return async (requestId, meta = {}) => {
    let error
    try {
      ;({ error } = await db.from(REQUEST_ID_TABLE).insert({ request_id: requestId, op: meta.op || null, entity: meta.entity || null }))
    } catch {
      return 'unavailable'
    }
    if (error) return error.code === '23505' ? 'duplicate' : 'unavailable'
    if (random() < pruneChance) {
      try {
        await db.from(REQUEST_ID_TABLE).delete().lt('received_at', new Date(clock() - retentionMs).toISOString())
      } catch {
        // Pruning is housekeeping only.
      }
    }
    return 'claimed'
  }
}

/** Validates the editable fields of a record. Returns { values } or { errors }. */
export function validateRecord(entity, record, { creating = false } = {}) {
  const definition = ENTITIES[entity]
  const values = {}
  const errors = []
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { errors: ['record must be an object'] }
  for (const key of Object.keys(record)) {
    if (!(key in definition.fields)) errors.push(`${key}: not editable here`)
  }
  for (const [key, check] of Object.entries(definition.fields)) {
    const value = check(record[key])
    if (value === INVALID) errors.push(`${key}: invalid value`)
    else if (value !== undefined) values[key] = value
  }
  if (creating && !values[definition.titleField]) errors.push(`${definition.titleField}: required`)
  if (definition.slugField && values.slug === null) errors.push('slug: required')
  if (definition.slugField && values.slug !== undefined && values.slug !== null && !SLUG.test(values.slug)) errors.push('slug: use lowercase letters, numbers and hyphens')
  return errors.length ? { errors } : { values }
}

function workflowFields(definition, status, existing = {}, now = new Date()) {
  const fields = { status }
  if (status === 'published') fields.published_at = existing.published_at || now.toISOString()
  else if (status === 'draft' || status === 'archived') fields.published_at = null
  // Workflow types are shown by their status; is_active stays true (as on every existing record)
  // and the older published/is_published mirrors follow the status.
  for (const field of definition.visibility) fields[field] = field === 'is_active' ? true : status === 'published'
  return fields
}

function activeFields(definition, active) {
  const fields = { is_active: Boolean(active) }
  for (const field of definition.visibility) fields[field] = Boolean(active)
  if (definition.activeStatus) fields[definition.activeStatus] = active ? 'published' : 'draft'
  return fields
}

const idOk = (definition, id) => (definition.idPattern || UUID).test(String(id || ''))

async function audit(deps, payload, action, entity, id, changes) {
  try {
    await deps.audit?.({ action, entity, id, actor: payload.actor || null, request_id: payload.request_id, changes })
  } catch {
    // Auditing never blocks a change; the WordPress side keeps its own log.
  }
}

async function revalidate(deps, definition, row, previousSlug) {
  try {
    return (await deps.revalidate?.(definition.contentType, { slug: row?.[definition.slugField || 'slug'] || '', previousSlug: previousSlug || '' })) || { ok: true }
  } catch (error) {
    return { ok: false, error: error?.message || String(error) }
  }
}

function publicRow(definition, row) {
  if (!row) return null
  const keep = new Set(['id', 'status', 'is_active', 'published_at', 'deleted_at', 'created_at', 'updated_at', 'draft_of_id', ...Object.keys(definition.fields), ...definition.list])
  return Object.fromEntries(Object.entries(row).filter(([key]) => keep.has(key)))
}

async function loadRow(db, definition, id) {
  const { data, error } = await db.from(definition.table).select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

async function handleSections(db, deps, payload) {
  const page = ENTITIES.pages
  if (payload.op === 'list') {
    if (!UUID.test(String(payload.page_id || ''))) return reply(400, { ok: false, error: 'invalid_page_id' })
    const { data, error } = await db.from('sections').select('id,page_id,type,order_index,content_json,style_json,visibility,updated_at').eq('page_id', payload.page_id).order('order_index', { ascending: true })
    if (error) return reply(500, { ok: false, error: 'database_error' })
    return reply(200, { ok: true, data: data || [] })
  }
  if (payload.op === 'save') {
    const s = payload.record || {}
    if (!UUID.test(String(s.page_id || ''))) return reply(400, { ok: false, error: 'invalid_page_id' })
    if (!SECTION_TYPES.includes(s.type)) return reply(400, { ok: false, error: 'unsupported_section_type' })
    const content = cleanSectionContent(Array.isArray(s.content_json) && !s.content_json.length ? {} : (s.content_json ?? {}))
    const style = cleanSectionStyle(s.style_json ?? {})
    const order = integer(0, 10000)(s.order_index ?? 0)
    if (content === INVALID || typeof content !== 'object' || Array.isArray(content) || style === INVALID || order === INVALID) return reply(400, { ok: false, error: 'invalid_section' })
    const row = { page_id: s.page_id, type: s.type, content_json: content, style_json: style, order_index: order ?? 0, visibility: s.visibility !== false }
    const pageRow = await loadRow(db, page, s.page_id)
    if (!pageRow) return reply(404, { ok: false, error: 'page_not_found' })
    let result
    if (payload.id) {
      if (!UUID.test(payload.id)) return reply(400, { ok: false, error: 'invalid_id' })
      result = await db.from('sections').update(row).eq('id', payload.id).eq('page_id', s.page_id).select('*').maybeSingle()
    } else {
      result = await db.from('sections').insert(row).select('*').single()
    }
    if (result.error) return reply(500, { ok: false, error: 'database_error' })
    if (!result.data) return reply(404, { ok: false, error: 'not_found' })
    await audit(deps, payload, payload.id ? 'update' : 'create', 'sections', result.data.id, { type: row.type })
    const revalidation = await revalidate(deps, page, pageRow)
    return reply(200, { ok: true, data: result.data, revalidation })
  }
  if (payload.op === 'delete') {
    if (!UUID.test(String(payload.id || '')) || !UUID.test(String(payload.page_id || ''))) return reply(400, { ok: false, error: 'invalid_id' })
    const { error } = await db.from('sections').delete().eq('id', payload.id).eq('page_id', payload.page_id)
    if (error) return reply(500, { ok: false, error: 'database_error' })
    await audit(deps, payload, 'delete', 'sections', payload.id, {})
    const revalidation = await revalidate(deps, page, await loadRow(db, page, payload.page_id))
    return reply(200, { ok: true, data: { id: payload.id, deleted: true }, revalidation })
  }
  if (payload.op === 'reorder_sections') {
    const ids = payload.ids
    if (!UUID.test(String(payload.page_id || '')) || !Array.isArray(ids) || ids.length > 200 || !ids.every((id) => UUID.test(String(id)))) return reply(400, { ok: false, error: 'invalid_order' })
    for (const [index, id] of ids.entries()) {
      const { error } = await db.from('sections').update({ order_index: index }).eq('id', id).eq('page_id', payload.page_id)
      if (error) return reply(500, { ok: false, error: 'database_error' })
    }
    await audit(deps, payload, 'reorder', 'sections', payload.page_id, { ids })
    const revalidation = await revalidate(deps, page, await loadRow(db, page, payload.page_id))
    return reply(200, { ok: true, data: { page_id: payload.page_id, order: ids }, revalidation })
  }
  return reply(400, { ok: false, error: 'invalid_op' })
}

/**
 * Saves the links a menu location shows today (it has no menu rows, so the site shows the ui_copy
 * list or the built-in list) as menu rows, so they can be edited. Locations that already have rows
 * are never touched. The result looks the same: same titles, addresses, targets and order.
 */
async function importMenuDefaults(db, deps, payload, now) {
  const wanted = Array.isArray(payload.locations) && payload.locations.length ? payload.locations : MENU_LOCATIONS
  if (!wanted.every((location) => MENU_LOCATIONS.includes(location))) return reply(400, { ok: false, error: 'invalid_location' })
  const { data: settings } = await db.from('site_settings').select('ui_copy').eq('id', 'default').maybeSingle()
  const uiCopy = settings?.ui_copy && typeof settings.ui_copy === 'object' ? settings.ui_copy : {}
  const imported = {}
  const skipped = []
  for (const location of wanted) {
    const { count, error: countError } = await db.from('menus').select('id', { count: 'exact', head: true }).eq('menu_location', location)
    if (countError) return reply(500, { ok: false, error: 'database_error' })
    if (Number(count) > 0) {
      skipped.push(location)
      continue
    }
    const rows = fallbackMenuLinks(location, uiCopy).map((item, index) => ({
      menu_location: location, title: item.title, url: item.url, target: item.target || '_self', order_index: index,
      is_active: true, status: 'published', desktop_visible: true, mobile_visible: true, updated_at: new Date(now).toISOString(),
    }))
    if (!rows.length) continue
    const { error } = await db.from('menus').insert(rows)
    if (error) return reply(500, { ok: false, error: 'database_error', details: [`menu "${location}" not imported`] })
    imported[location] = rows.length
  }
  await audit(deps, payload, 'import_menu_defaults', 'menus', null, { imported, skipped })
  const revalidation = Object.keys(imported).length ? await revalidate(deps, ENTITIES.menus, null) : { ok: true }
  return reply(200, { ok: true, data: { imported, skipped }, revalidation })
}

/**
 * POST /api/wordpress/content
 * ops: list | get | save | set_status | trash | restore | delete | reorder_sections (entity "sections")
 */
export async function handleContentRequest({ rawBody, headers, config, deps, now = Date.now() }) {
  const auth = authenticate({ rawBody, headers, config, now })
  if (!auth.payload) return auth
  const payload = auth.payload
  const db = deps.db
  if (!db) return reply(503, { ok: false, error: 'database_unavailable' })

  if (MUTATING_OPS.has(payload.op)) {
    if (deps.claimRequest) {
      // Durable: every server instance shares the store, so a replay is refused wherever it lands.
      const claim = await deps.claimRequest(payload.request_id, { op: payload.op, entity: payload.entity })
      if (claim === 'duplicate') return reply(409, { ok: false, error: 'duplicate_request' })
      if (claim !== 'claimed') return reply(503, { ok: false, error: 'replay_protection_unavailable' })
    } else if (deps.deduper) {
      if (deps.deduper.has(payload.request_id, now)) return reply(409, { ok: false, error: 'duplicate_request' })
      deps.deduper.add(payload.request_id, now)
    } else {
      return reply(503, { ok: false, error: 'replay_protection_unavailable' })
    }
  }

  try {
    if (payload.entity === 'sections') return await handleSections(db, deps, payload)
    const definition = ENTITIES[payload.entity]
    if (!definition) return reply(400, { ok: false, error: 'unsupported_entity' })
    const { op } = payload

    if (op === 'list') {
      const limit = Math.min(Math.max(Number(payload.limit) || 50, 1), 200)
      const offset = Math.max(Number(payload.offset) || 0, 0)
      let query = db.from(definition.table).select(definition.list.join(','), { count: 'exact' })
      if (definition.softDelete) query = payload.trashed ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null)
      // A page's staged draft (draft_of_id) is reached from its live page, never listed on its own.
      if (payload.entity === 'pages') query = query.is('draft_of_id', null)
      if (payload.status && definition.workflow === 'status' && WORKFLOW_STATUSES.includes(payload.status)) query = query.eq('status', payload.status)
      for (const [field, allowed] of Object.entries(definition.filterable || {})) {
        const wanted = payload.filter?.[field]
        if (wanted !== undefined && wanted !== null && wanted !== '') {
          if (!allowed.includes(wanted)) return reply(400, { ok: false, error: 'invalid_filter' })
          query = query.eq(field, wanted)
        }
      }
      if (typeof payload.search === 'string' && payload.search.trim()) {
        const term = payload.search.trim().replace(/[%,()]/g, ' ').slice(0, 80)
        query = query.or(`${definition.titleField}.ilike.%${term}%${definition.slugField ? `,${definition.slugField}.ilike.%${term}%` : ''}`)
      }
      for (const column of definition.orderBy || [definition.workflow === 'status' ? 'updated_at' : definition.titleField]) {
        query = query.order(column, { ascending: Boolean(definition.orderBy) || definition.workflow !== 'status' })
      }
      query = query.range(offset, offset + limit - 1)
      const { data, error, count } = await query
      if (error) return reply(500, { ok: false, error: 'database_error' })
      return reply(200, { ok: true, data: data || [], total: count ?? (data || []).length })
    }

    if (op === 'get') {
      if (!idOk(definition, payload.id)) return reply(400, { ok: false, error: 'invalid_id' })
      const row = await loadRow(db, definition, payload.id)
      if (!row) return reply(404, { ok: false, error: 'not_found' })
      const data = publicRow(definition, row)
      if (payload.entity === 'pages' && !row.draft_of_id) {
        const { data: draft } = await db.from('pages').select('id').eq('draft_of_id', payload.id).maybeSingle()
        data.draft_id = draft?.id || null
      }
      if (payload.entity === 'blogs') {
        // Main draws a blog from rows in the older blog_content_blocks table first, when it has any:
        // then the blocks edited here would not show, and the editor says so.
        const { count } = await db.from('blog_content_blocks').select('id', { count: 'exact', head: true }).eq('blog_id', payload.id)
        data.legacy_blocks = Number(count) || 0
        // Read-only: blogs without blocks are drawn from this plain text, so the editor starts from it.
        data.content = typeof row.content === 'string' ? row.content : ''
      }
      return reply(200, { ok: true, data })
    }

    if (op === 'save') {
      const creating = !payload.id
      if (creating && definition.creatable === false) return reply(400, { ok: false, error: 'not_supported' })
      if (!creating && !idOk(definition, payload.id)) return reply(400, { ok: false, error: 'invalid_id' })
      const { values, errors } = validateRecord(payload.entity, payload.record, { creating })
      if (errors) return reply(400, { ok: false, error: 'validation_failed', details: errors })
      const existing = creating ? null : await loadRow(db, definition, payload.id)
      if (!creating && !existing) return reply(404, { ok: false, error: 'not_found' })
      if (definition.slugField && values.slug) {
        const { data: clashes } = await db.from(definition.table).select(payload.entity === 'pages' ? 'id, draft_of_id' : 'id').eq(definition.slugField, values.slug).neq('id', payload.id || '00000000-0000-0000-0000-000000000000').limit(5)
        // A page's private draft shares the live page's address by design, so the two never clash.
        const clash = (clashes || []).find((row) => !payload.id || (row.draft_of_id !== payload.id && row.id !== existing?.draft_of_id))
        if (clash) return reply(409, { ok: false, error: 'slug_taken', details: [`slug "${values.slug}" is already used by another ${payload.entity} record`] })
      }
      if (creating && definition.slugField && !values.slug) return reply(400, { ok: false, error: 'validation_failed', details: ['slug: required'] })
      if (payload.entity === 'blogs' && values.content_json) values.content = blogPlainText(values.content_json)
      if (creating && definition.workflow !== 'none') Object.assign(values, definition.workflow === 'status' ? workflowFields(definition, 'draft') : activeFields(definition, false))
      if (definition.timestamps !== false) values.updated_at = new Date(now).toISOString()
      const result = creating
        ? await db.from(definition.table).insert(values).select('*').single()
        : await db.from(definition.table).update(values).eq('id', payload.id).select('*').single()
      if (result.error) return reply(500, { ok: false, error: 'database_error' })
      await audit(deps, payload, creating ? 'create' : 'update', payload.entity, result.data.id, { fields: Object.keys(values) })
      const revalidation = await revalidate(deps, definition, result.data, existing && existing.slug !== result.data.slug ? existing.slug : '')
      return reply(200, { ok: true, data: publicRow(definition, result.data), revalidation })
    }

    if (op === 'import_menu_defaults') {
      if (payload.entity !== 'menus') return reply(400, { ok: false, error: 'not_supported' })
      return await importMenuDefaults(db, deps, payload, now)
    }

    if (op === 'start_draft' && payload.entity !== 'pages') return reply(400, { ok: false, error: 'not_supported' })
    if (!idOk(definition, payload.id)) return reply(400, { ok: false, error: 'invalid_id' })
    const existing = await loadRow(db, definition, payload.id)
    if (!existing) return reply(404, { ok: false, error: 'not_found' })

    if (op === 'start_draft') {
      if (payload.entity !== 'pages') return reply(400, { ok: false, error: 'not_supported' })
      const result = await deps.startPageDraft(payload.id)
      if (!result.ok) return reply(result.status, { ok: false, error: 'draft_failed', details: [result.error] })
      await audit(deps, payload, 'start_draft', 'pages', result.draft.id, { live_id: payload.id })
      return reply(200, { ok: true, data: publicRow(definition, result.draft) })
    }

    let update = null
    if (definition.workflow === 'none' && ['set_status', 'trash', 'restore'].includes(op)) return reply(400, { ok: false, error: 'not_supported' })
    if (op === 'delete' && definition.deletable === false) return reply(400, { ok: false, error: 'not_supported' })
    if (op === 'set_status') {
      if (definition.workflow === 'status') {
        if (!WORKFLOW_STATUSES.includes(payload.status)) return reply(400, { ok: false, error: 'invalid_status' })
        if (existing.deleted_at) return reply(409, { ok: false, error: 'in_trash' })
        if (payload.entity === 'pages' && payload.status === 'published') {
          // Main's own publish path: broken-link check first, then the atomic publish_page_draft()
          // (a staged draft is merged onto its live page, which keeps its id and address).
          const result = await deps.publishPage(payload.id)
          if (!result.ok) return reply(result.status, { ok: false, error: result.broken ? 'broken_links' : 'publish_failed', details: result.broken || [result.error] })
          await audit(deps, payload, 'publish', 'pages', result.live?.id || payload.id, { from: payload.id })
          const revalidation = await revalidate(deps, definition, result.live, result.previousSlug || '')
          return reply(200, { ok: true, data: publicRow(definition, result.live), merged_into: result.live?.id !== payload.id ? result.live?.id : null, revalidation })
        }
        update = workflowFields(definition, payload.status, existing, new Date(now))
      } else {
        if (typeof payload.active !== 'boolean') return reply(400, { ok: false, error: 'invalid_status' })
        if (existing.deleted_at) return reply(409, { ok: false, error: 'in_trash' })
        update = activeFields(definition, payload.active)
      }
    } else if (op === 'trash') {
      update = definition.workflow === 'status' ? workflowFields(definition, 'draft') : activeFields(definition, false)
      if (definition.softDelete) update.deleted_at = new Date(now).toISOString()
    } else if (op === 'restore') {
      if (!definition.softDelete) return reply(400, { ok: false, error: 'not_supported' })
      update = { deleted_at: null }
    } else if (op === 'delete') {
      // Permanent: only for a record already in the trash (or inactive, for types without a trash),
      // and only with an explicit confirmation.
      if (payload.confirm !== true) return reply(400, { ok: false, error: 'confirmation_required' })
      const removable = definition.softDelete ? Boolean(existing.deleted_at) : existing.is_active === false
      if (!removable) return reply(409, { ok: false, error: definition.softDelete ? 'not_in_trash' : 'still_active' })
      if (payload.entity === 'pages') await db.from('sections').delete().eq('page_id', payload.id)
      const { error } = await db.from(definition.table).delete().eq('id', payload.id)
      if (error) return reply(500, { ok: false, error: 'database_error' })
      await audit(deps, payload, 'delete', payload.entity, payload.id, {})
      const revalidation = await revalidate(deps, definition, existing)
      return reply(200, { ok: true, data: { id: payload.id, deleted: true }, revalidation })
    } else {
      return reply(400, { ok: false, error: 'invalid_op' })
    }

    if (definition.timestamps !== false) update.updated_at = new Date(now).toISOString()
    const { data, error } = await db.from(definition.table).update(update).eq('id', payload.id).select('*').single()
    if (error) return reply(500, { ok: false, error: 'database_error' })
    await audit(deps, payload, op, payload.entity, payload.id, update)
    const revalidation = await revalidate(deps, definition, data)
    return reply(200, { ok: true, data: publicRow(definition, data), revalidation })
  } catch (error) {
    deps.log?.('error', { op: payload.op, entity: payload.entity, error: error?.message || String(error) })
    return reply(500, { ok: false, error: 'internal_error' })
  }
}
