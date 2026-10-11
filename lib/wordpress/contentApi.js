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
import { HOME_LISTS, HOME_LIST_PREFIX } from '../homepageDefaults.js'
import { RESERVED_SINGLE_SEGMENT_SLUGS } from '../cmsPagePrivacy.js'

export const CONTENT_API_MAX_BYTES = 512 * 1024
// An upload carries one image of at most MEDIA_MAX_BYTES as base64 (4/3 larger), under Vercel's 4.5 MB.
export const MEDIA_MAX_BYTES = 3 * 1024 * 1024
export const CONTENT_API_UPLOAD_MAX_BYTES = Math.ceil(MEDIA_MAX_BYTES * 4 / 3) + 64 * 1024
export const MEDIA_BUCKET = 'site-assets'
export const MEDIA_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }
export const WORKFLOW_STATUSES = ['draft', 'review', 'approved', 'published', 'archived']
const MUTATING_OPS = new Set(['save', 'set_status', 'trash', 'restore', 'delete', 'reorder_sections', 'start_draft', 'import_menu_defaults', 'import_homepage_defaults', 'upload'])
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
  // Exactly the registry of components/sections/DynamicSectionRenderer.jsx.
  'hero', 'text_block', 'image_block', 'video_block', 'two_column_layout', 'three_column_layout', 'testimonial', 'faq', 'gallery',
  'cta_banner', 'stats_section', 'feature_cards', 'pricing', 'team', 'map', 'custom_rich_text',
  'testimonials_feed', 'placement_feed', 'recruiters_feed', 'instructors_feed', 'certifications_feed', 'success_stories_feed',
  'metrics_counters', 'trust_badges_feed', 'community_events_feed', 'cta_block_ref', 'courses_feed', 'tools_feed', 'company_logos_feed',
  'lead_form', 'form_embed', 'location_explorer', 'interactive_learner_map',
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

/**
 * An edited homepage list must keep the shape the homepage draws: plain lines for line lists, and
 * for item lists only the fields the built-in items have (text, numbers, switches, lists of lines).
 */
export function cleanHomeList(key, value) {
  const list = HOME_LISTS[key]
  if (!list || !Array.isArray(value) || value.length > 200) return INVALID
  if (list.strings) {
    const lines = value.map((item) => (typeof item === 'string' && item.trim().length <= 2000 ? item.trim() : INVALID))
    return lines.includes(INVALID) ? INVALID : lines.filter(Boolean)
  }
  const allowed = new Set(list.defaults.flatMap((item) => Object.keys(item)))
  const items = []
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return INVALID
    const clean = {}
    for (const [field, v] of Object.entries(item)) {
      if (!allowed.has(field)) return INVALID
      if (v === null || v === undefined || v === '') continue
      if (typeof v === 'string') {
        if (v.length > 5000) return INVALID
        clean[field] = v.trim()
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        clean[field] = v
      } else if (Array.isArray(v) && v.length <= 100 && v.every((line) => typeof line === 'string' && line.length <= 2000)) {
        clean[field] = v.map((line) => line.trim()).filter(Boolean)
      } else {
        return INVALID
      }
    }
    if (Object.keys(clean).length) items.push(clean)
  }
  return items
}

/** A course curriculum as CurriculumTimeline draws it: [{ title, topics: [lines] }]. */
function cleanCurriculum(value) {
  if (value === undefined) return undefined
  if (value === null) return []
  if (!Array.isArray(value) || value.length > 100) return INVALID
  const modules = []
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return INVALID
    for (const key of Object.keys(item)) if (!['title', 'topics'].includes(key)) return INVALID
    const title = text(300)(item.title ?? '')
    const topics = stringList(100, 1000)(item.topics ?? [])
    if (title === INVALID || topics === INVALID) return INVALID
    if (title || topics.length) modules.push({ title: title || '', topics })
  }
  return modules
}

/** A list of items with only these fields: text, numbers, or lists of lines (e.g. a feature's points). */
const items = (fields, { max = 100 } = {}) => (value) => {
  if (value === undefined) return undefined
  if (value === null) return []
  if (!Array.isArray(value) || value.length > max) return INVALID
  const out = []
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return INVALID
    const clean = {}
    for (const [key, v] of Object.entries(item)) {
      if (!fields.includes(key)) return INVALID
      if (v === null || v === undefined || v === '') continue
      if (typeof v === 'string') { if (v.length > 5000) return INVALID; clean[key] = v.trim() }
      else if (typeof v === 'number') clean[key] = v
      else if (Array.isArray(v) && v.length <= 50 && v.every((l) => typeof l === 'string' && l.length <= 1000)) clean[key] = v.map((l) => l.trim()).filter(Boolean)
      else return INVALID
    }
    if (Object.keys(clean).length) out.push(clean)
  }
  return out
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
    table: 'pages', contentType: 'page', titleField: 'title', slugField: 'slug', workflow: 'status', softDelete: true, sharedAddressWith: 'service_pages', sectionParent: true,
    notNull: ['noindex'],
    visibility: ['is_active', 'is_published'],
    // Main draws a page only from its sections (or, without any, from title + description);
    // pages.content is never rendered, so it is not offered as an editable field.
    fields: { title: text(200, { required: true }), slug: text(120), description: text(2000), ...SEO, scheduled_publish_at: isoDate(), scheduled_unpublish_at: isoDate() },
    list: ['id', 'title', 'slug', 'status', 'updated_at', 'published_at', 'deleted_at', 'scheduled_publish_at', 'draft_of_id'],
  },
  blogs: {
    table: 'blogs', contentType: 'blog', titleField: 'title', slugField: 'slug', workflow: 'status', softDelete: true,
    notNull: ['categories', 'tags', 'noindex'],
    visibility: ['published', 'is_published', 'is_active'],
    fields: {
      title: text(300, { required: true }), slug: text(160), excerpt: text(1000), description: text(2000), content_json: cleanBlogBlocks,
      featured_image: url(), categories: stringList(20, 100), tags: stringList(40, 60), author_id: uuid(), category_id: uuid(), ...SEO,
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
    table: 'locations', contentType: 'location', titleField: 'name', slugField: 'slug', workflow: 'active', softDelete: false, sectionParent: true,
    notNull: ['location_type'],
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
    notNull: ['highlights'],
    visibility: [],
    fields: { name: text(200, { required: true }), slug: text(120), state: text(100), country: text(100), meta_title: text(300), meta_description: text(500), intro_text: text(10000), highlights: stringList(50, 500) },
    list: ['id', 'name', 'slug', 'is_active', 'updated_at'],
  },
  // Site-wide settings and menus. Only the fields the public header, footer and navigation actually
  // draw (src/components/Layout/PublicLayout.jsx, src/components/Navbar.jsx) are editable; the rest
  // of each row is kept as it is. These rows already exist: they are edited, never created or deleted.
  site_settings: {
    table: 'site_settings', contentType: 'navigation', titleField: 'company_name', slugField: null, workflow: 'none', softDelete: false,
    notNull: ['social_links', 'ui_copy'],
    creatable: false, deletable: false, idPattern: /^[a-z0-9_-]{1,60}$/i,
    visibility: [],
    fields: { company_name: text(200), social_links: json(), ui_copy: json({ shape: 'object' }) },
    list: ['id', 'company_name', 'updated_at'],
  },
  header_settings: {
    table: 'header_settings', contentType: 'navigation', titleField: 'announcement_text', slugField: null, workflow: 'none', softDelete: false,
    notNull: ['social_items'],
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
    notNull: ['social_items'],
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
    notNull: ['menu_location', 'order_index', 'target', 'desktop_visible', 'mobile_visible'],
    orderBy: ['menu_location', 'order_index'], filterable: { menu_location: MENU_LOCATIONS },
    visibility: [],
    fields: {
      menu_location: choice(MENU_LOCATIONS), title: text(200, { required: true }), url: link({ required: true }), order_index: integer(0, 10000),
      parent_id: uuid(), target: choice(['_self', '_blank']), desktop_visible: bool(), mobile_visible: bool(),
    },
    list: ['id', 'title', 'url', 'menu_location', 'order_index', 'parent_id', 'target', 'is_active', 'status', 'desktop_visible', 'mobile_visible', 'updated_at'],
  },
  // Homepage (src/legacy/pages/HomePage.jsx): only what the page draws.
  homepage_hero: {
    table: 'homepage_hero', contentType: 'homepage_section', titleField: 'heading', slugField: null, workflow: 'none', softDelete: false,
    creatable: false, deletable: false, visibility: [],
    fields: { badge_text: text(200), heading: text(300), subheading: text(1000) },
    list: ['id', 'heading', 'updated_at'],
  },
  homepage_cta: {
    table: 'homepage_cta', contentType: 'homepage_section', titleField: 'title', slugField: null, workflow: 'none', softDelete: false,
    creatable: false, deletable: false, visibility: [],
    fields: { title: text(300), description: text(2000), button_text: text(100), button_link: link() },
    list: ['id', 'title', 'updated_at'],
  },
  home_sections: {
    // The three homepage sections read from home_sections (who_for, blog_section, registration_popup).
    table: 'home_sections', contentType: 'homepage_section', titleField: 'title', slugField: null, workflow: 'active', softDelete: false,
    creatable: false, deletable: false, visibility: [], onlyKeys: ['who_for', 'blog_section', 'registration_popup'], orderBy: ['order_index'],
    fields: { title: text(300), subtitle: text(1000), body: text(5000), items_json: json({ shape: 'array' }), cta_json: json({ shape: 'object' }) },
    list: ['id', 'section_key', 'title', 'is_active', 'order_index', 'updated_at'],
  },
  home_lists: {
    // Homepage lists, stored as home_sections rows "home_list_<key>"; hiding one brings back the built-in list.
    table: 'home_sections', contentType: 'homepage_section', titleField: 'title', slugField: null, workflow: 'active', softDelete: false,
    creatable: false, deletable: false, visibility: [], keyPrefix: HOME_LIST_PREFIX, orderBy: ['order_index'],
    fields: { items_json: (value) => value },
    list: ['id', 'section_key', 'title', 'is_active', 'order_index', 'updated_at'],
  },
  courses: {
    // Course pages (components/cms/ImmersiveCourseRenderer.jsx) and the /courses list. Showing a course
    // keeps Main's visibility columns in step (is_active, is_published, published, status).
    table: 'courses', contentType: 'course', titleField: 'title', slugField: 'slug', workflow: 'active', activeStatus: 'status', softDelete: true,
    notNull: ['internship', 'placement_support', 'skills', 'curriculum', 'order_index', 'noindex'],
    visibility: ['is_published', 'published'], orderBy: ['order_index', 'title'],
    fields: {
      title: text(300, { required: true }), slug: text(120), subtitle: text(300), short_title: text(120), badge: text(100),
      short_description: text(1000), description: text(10000), image_url: url(), thumbnail_url: url(),
      duration_value: integer(0, 1000), duration_unit: text(30), learning_mode: text(100), learning_hours: integer(0, 100000),
      projects_count: integer(0, 10000), case_studies_count: integer(0, 10000), ai_tools_count: integer(0, 10000), certification_count: integer(0, 10000),
      internship: bool(), placement_support: bool(), skills: stringList(100, 200), curriculum: cleanCurriculum,
      brochure_url: url(), primary_cta_label: text(100), primary_cta_url: link(), secondary_cta_label: text(100), secondary_cta_url: link(),
      order_index: integer(0, 10000), is_featured: bool(),
      meta_title: text(300), meta_description: text(500), canonical_url: url(), noindex: bool(), og_image_url: url(), exclude_from_sitemap: bool(),
    },
    list: ['id', 'title', 'slug', 'is_active', 'order_index', 'updated_at', 'deleted_at'],
  },
  course_details: {
    // Text sections of a course, shown by the older course page (CourseDetailLegacyClient).
    table: 'course_details', contentType: 'course', titleField: 'section_title', slugField: null, workflow: 'none', softDelete: false,
    notNull: ['order_index'],
    creatable: true, visibility: [], orderBy: ['order_index'], parentFilter: 'course_id', requiredOnCreate: ['course_id'],
    fields: { course_id: uuid({ required: true }), section_title: text(300, { required: true }), content: text(20000), order_index: integer(0, 10000) },
    list: ['id', 'course_id', 'section_title', 'order_index', 'updated_at'],
  },
  city_pages: {
    // /digital-marketing-course-in-<slug> (components/cms/CityPageRenderer.jsx), shown when is_active.
    table: 'city_pages', contentType: 'city_page', titleField: 'city_name', slugField: 'slug', workflow: 'active', softDelete: true,
    notNull: ['features', 'stats', 'testimonials', 'faqs'],
    visibility: [], sectionParent: true,
    fields: {
      city_name: text(200, { required: true }), slug: text(120), hero_title: text(300), hero_subtitle: text(500), hero_description: text(3000), hero_image_url: url(),
      about_title: text(300), about_description: text(10000), about_image_url: url(),
      features: items(['title', 'text', 'list']), stats: items(['icon', 'label', 'value'], { max: 12 }),
      testimonials: items(['name', 'quote', 'rating', 'company', 'role']), faqs: items(['question', 'answer']),
      contact_phone: text(60), contact_email: text(200), contact_address: text(1000),
      seo_title: text(300), seo_description: text(500), canonical_url: url(), exclude_from_sitemap: bool(),
    },
    list: ['id', 'city_name', 'slug', 'is_active', 'updated_at', 'deleted_at'],
  },
  service_pages: {
    // /<slug> (components/cms/ServicePageRenderer.jsx), e.g. a course in one city; shown when is_active.
    table: 'service_pages', contentType: 'service_page', titleField: 'title', slugField: 'slug', workflow: 'active', softDelete: false,
    notNull: ['curriculum', 'benefits', 'faqs', 'order_index'],
    visibility: [], sectionParent: true, sharedAddressWith: 'pages',
    fields: {
      title: text(300, { required: true }), slug: text(120), hero_title: text(300), hero_subtitle: text(500), overview: text(10000),
      curriculum: items(['title']), benefits: items(['title', 'description']), faqs: items(['question', 'answer']),
      meta_title: text(300), meta_description: text(500), order_index: integer(0, 10000),
    },
    list: ['id', 'title', 'slug', 'is_active', 'updated_at'],
  },
  seo_metadata: {
    // Per-address SEO overrides (app/(public)/[slug]/page.jsx prefers them over a page's own SEO fields).
    table: 'seo_metadata', contentType: 'page', titleField: 'page_slug', slugField: null, revalidateSlugField: 'page_slug', workflow: 'none', softDelete: false,
    creatable: false, visibility: [],
    fields: { meta_title: text(300), meta_description: text(500), canonical_url: url(), og_image: url() },
    list: ['id', 'page_slug', 'meta_title', 'updated_at'],
  },
  media: {
    // Main's media library (Supabase storage + the media table). New files arrive through op "upload".
    table: 'media', contentType: null, titleField: 'name', slugField: null, workflow: 'none', softDelete: false,
    creatable: false, deletable: false, visibility: [], orderBy: ['created_at'], orderDescending: true,
    fields: { name: text(300), alt_text: text(500), caption: text(1000) },
    list: ['id', 'url', 'name', 'alt_text', 'caption', 'type', 'bucket', 'width', 'height', 'created_at'],
  },
  // Blog authors, categories and tags (/blog/author/<slug>, /blog/category/<slug>, /blog/tag/<slug>).
  authors: {
    table: 'authors', contentType: 'author', titleField: 'name', slugField: 'slug', workflow: 'none', softDelete: false, visibility: [],
    inUseBy: [{ table: 'blogs', field: 'author_id', label: 'blogs' }],
    fields: { name: text(200, { required: true }), slug: text(120), bio: text(3000), avatar: url() },
    list: ['id', 'name', 'slug', 'updated_at'],
  },
  blog_categories: {
    table: 'blog_categories', contentType: 'blog_category', titleField: 'name', slugField: 'slug', workflow: 'none', softDelete: false, visibility: [],
    inUseBy: [{ table: 'blogs', field: 'category_id', label: 'blogs' }],
    fields: { name: text(200, { required: true }), slug: text(120), description: text(3000) },
    list: ['id', 'name', 'slug', 'updated_at'],
  },
  blog_tags: {
    table: 'blog_tags', contentType: 'blog_tag', titleField: 'name', slugField: 'slug', workflow: 'none', softDelete: false, visibility: [],
    fields: { name: text(120, { required: true }), slug: text(120) },
    list: ['id', 'name', 'slug', 'updated_at'],
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
/** A database refusal: generic for WordPress, logged in full (code and message, no content) for the developer. */
const dbFail = (deps, payload, error) => {
  deps?.log?.('database_error', { op: payload?.op, entity: payload?.entity, code: error?.code || null, message: String(error?.message || error || '').slice(0, 300) })
  return reply(500, { ok: false, error: 'database_error' })
}
const readHeader = (headers, name) => (headers && typeof headers.get === 'function' ? headers.get(name) || '' : (headers || {})[name] || '')

function authenticate({ rawBody, headers, config, now }) {
  if (!config.enabled) return reply(503, { ok: false, error: 'content_api_disabled' })
  if (!config.secret || config.secret.length < 32) return reply(503, { ok: false, error: 'not_configured' })
  const size = Buffer.byteLength(rawBody || '', 'utf8')
  if (size > CONTENT_API_UPLOAD_MAX_BYTES) return reply(413, { ok: false, error: 'payload_too_large' })
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
  if (payload.op !== 'upload' && size > CONTENT_API_MAX_BYTES) return reply(413, { ok: false, error: 'payload_too_large' })
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
  // Required columns (with a database default): an empty value is left out rather than sent as null.
  for (const key of definition.notNull || []) if (values[key] === null) delete values[key]
  if (creating && !values[definition.titleField]) errors.push(`${definition.titleField}: required`)
  for (const key of creating ? definition.requiredOnCreate || [] : []) {
    if (values[key] === undefined || values[key] === null) errors.push(`${key}: required`)
  }
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
/** Types sharing a table (home_sections) only reach their own rows. */
const belongsToType = (definition, row) =>
  (!definition.onlyKeys || definition.onlyKeys.includes(row.section_key)) && (!definition.keyPrefix || String(row.section_key || '').startsWith(definition.keyPrefix))

async function audit(deps, payload, action, entity, id, changes) {
  try {
    await deps.audit?.({ action, entity, id, actor: payload.actor || null, request_id: payload.request_id, changes })
  } catch {
    // Auditing never blocks a change; the WordPress side keeps its own log.
  }
}

async function revalidate(deps, definition, row, previousSlug) {
  if (!definition.contentType) return { ok: true }
  try {
    return (await deps.revalidate?.(definition.contentType, { slug: row?.[definition.revalidateSlugField || definition.slugField || 'slug'] || '', previousSlug: previousSlug || '' })) || { ok: true }
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

// Where extra sections can sit on a city, service or location page (sectionsForZone in their renderers).
export const SECTION_POSITIONS = ['top', 'after_intro', 'before_faq', 'end']
const SECTION_PARENTS = {
  pages: { table: 'sections', field: 'page_id', positions: false },
  city_pages: { table: 'city_page_sections', field: 'city_page_id', positions: true },
  service_pages: { table: 'service_page_sections', field: 'service_page_id', positions: true },
  locations: { table: 'location_sections', field: 'location_id', positions: true },
}

async function handleSections(db, deps, payload) {
  const parentKey = payload.parent || 'pages'
  const cfg = SECTION_PARENTS[parentKey]
  if (!cfg) return reply(400, { ok: false, error: 'invalid_parent' })
  const page = ENTITIES[parentKey]
  if (payload.op === 'list') {
    if (!UUID.test(String(payload.page_id || ''))) return reply(400, { ok: false, error: 'invalid_page_id' })
    const { data, error } = await db.from(cfg.table).select(`id,${cfg.field},type,order_index,content_json,style_json,visibility,updated_at${cfg.positions ? ',position' : ''}`).eq(cfg.field, payload.page_id).order('order_index', { ascending: true })
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
    const position = cfg.positions ? (s.position || 'end') : undefined
    if (cfg.positions && !SECTION_POSITIONS.includes(position)) return reply(400, { ok: false, error: 'invalid_section' })
    const row = { [cfg.field]: s.page_id, type: s.type, content_json: content, style_json: style, order_index: order ?? 0, visibility: s.visibility !== false, ...(cfg.positions ? { position } : {}) }
    const pageRow = await loadRow(db, page, s.page_id)
    if (!pageRow) return reply(404, { ok: false, error: 'page_not_found' })
    let result
    if (payload.id) {
      if (!UUID.test(payload.id)) return reply(400, { ok: false, error: 'invalid_id' })
      result = await db.from(cfg.table).update(row).eq('id', payload.id).eq(cfg.field, s.page_id).select('*').maybeSingle()
    } else {
      result = await db.from(cfg.table).insert(row).select('*').single()
    }
    if (result.error) return dbFail(deps, payload, result.error)
    if (!result.data) return reply(404, { ok: false, error: 'not_found' })
    await audit(deps, payload, payload.id ? 'update' : 'create', 'sections', result.data.id, { type: row.type, parent: parentKey })
    const revalidation = await revalidate(deps, page, pageRow)
    return reply(200, { ok: true, data: result.data, revalidation })
  }
  if (payload.op === 'delete') {
    if (!UUID.test(String(payload.id || '')) || !UUID.test(String(payload.page_id || ''))) return reply(400, { ok: false, error: 'invalid_id' })
    const { error } = await db.from(cfg.table).delete().eq('id', payload.id).eq(cfg.field, payload.page_id)
    if (error) return reply(500, { ok: false, error: 'database_error' })
    await audit(deps, payload, 'delete', 'sections', payload.id, {})
    const revalidation = await revalidate(deps, page, await loadRow(db, page, payload.page_id))
    return reply(200, { ok: true, data: { id: payload.id, deleted: true }, revalidation })
  }
  if (payload.op === 'reorder_sections') {
    const ids = payload.ids
    if (!UUID.test(String(payload.page_id || '')) || !Array.isArray(ids) || ids.length > 200 || !ids.every((id) => UUID.test(String(id)))) return reply(400, { ok: false, error: 'invalid_order' })
    for (const [index, id] of ids.entries()) {
      const { error } = await db.from(cfg.table).update({ order_index: index }).eq('id', id).eq(cfg.field, payload.page_id)
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

/** File signatures of the accepted image types (the declared type must match the bytes). */
function sniffImage(buf) {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  if (/^GIF8[79]a$/.test(buf.subarray(0, 6).toString('latin1'))) return 'image/gif'
  if (buf.subarray(4, 12).toString('latin1') === 'ftypavif') return 'image/avif'
  return null
}

/**
 * Stores one image in Main's media library: Supabase storage (bucket MEDIA_BUCKET) and a media row,
 * as Main's own /admin upload does. Images only (no SVG: it can carry scripts), at most MEDIA_MAX_BYTES.
 */
async function uploadMedia(db, deps, payload, now) {
  const declared = String(payload.content_type || '').toLowerCase()
  if (!MEDIA_TYPES[declared]) return reply(400, { ok: false, error: 'unsupported_type', details: ['Images only: JPEG, PNG, WebP, GIF or AVIF.'] })
  if (typeof payload.data !== 'string' || !/^[A-Za-z0-9+/=\s]+$/.test(payload.data)) return reply(400, { ok: false, error: 'invalid_file' })
  const buf = Buffer.from(payload.data, 'base64')
  if (!buf.length) return reply(400, { ok: false, error: 'invalid_file' })
  if (buf.length > MEDIA_MAX_BYTES) return reply(413, { ok: false, error: 'file_too_large', details: ['At most 3 MB.'] })
  if (sniffImage(buf) !== declared) return reply(400, { ok: false, error: 'invalid_file', details: ['The file is not the image type it claims to be.'] })
  const base = String(payload.filename || 'image').toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 60) || 'image'
  const date = new Date(now)
  const path = `wordpress/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${payload.request_id.slice(0, 8)}-${base}.${MEDIA_TYPES[declared]}`
  if (!db.storage) return reply(503, { ok: false, error: 'storage_unavailable' })
  const { error: uploadError } = await db.storage.from(MEDIA_BUCKET).upload(path, buf, { contentType: declared, upsert: false })
  if (uploadError) return dbFail(deps, payload, uploadError)
  const { data: publicUrl } = db.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  const row = {
    url: publicUrl?.publicUrl, bucket: MEDIA_BUCKET, path, type: 'image', size: buf.length, name: text(300)(payload.filename || base) || base,
    alt_text: text(500)(payload.alt_text ?? '') || null, folder: 'wordpress', entity_type: 'wordpress', updated_at: date.toISOString(),
  }
  const { data, error } = await db.from('media').insert(row).select('*').single()
  if (error) return dbFail(deps, payload, error)
  await audit(deps, payload, 'upload', 'media', data.id, { path, size: buf.length })
  return reply(200, { ok: true, data: publicRow(ENTITIES.media, data) })
}

/**
 * Saves each homepage list the homepage shows from its built-in content as an editable list, with
 * exactly that content, so the homepage looks the same. Lists that already exist are never touched.
 */
async function importHomepageDefaults(db, deps, payload, now) {
  const { data: existing, error } = await db.from('home_sections').select('section_key').like('section_key', `${HOME_LIST_PREFIX}%`)
  if (error) return reply(500, { ok: false, error: 'database_error' })
  const have = new Set((existing || []).map((row) => row.section_key))
  const rows = Object.entries(HOME_LISTS)
    .filter(([key]) => !have.has(HOME_LIST_PREFIX + key))
    .map(([key, list], index) => ({
      section_key: HOME_LIST_PREFIX + key, title: list.label, items_json: list.defaults, is_active: true,
      order_index: 1000 + index, updated_at: new Date(now).toISOString(),
    }))
  if (rows.length) {
    const { error: insertError } = await db.from('home_sections').insert(rows)
    if (insertError) return reply(500, { ok: false, error: 'database_error' })
  }
  const imported = rows.map((row) => row.section_key.slice(HOME_LIST_PREFIX.length))
  await audit(deps, payload, 'import_homepage_defaults', 'home_lists', null, { imported })
  const revalidation = rows.length ? await revalidate(deps, ENTITIES.home_lists, null) : { ok: true }
  return reply(200, { ok: true, data: { imported, skipped: [...have].map((k) => k.slice(HOME_LIST_PREFIX.length)) }, revalidation })
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
      if (definition.parentFilter) {
        if (!UUID.test(String(payload.parent_id || ''))) return reply(400, { ok: false, error: 'parent_required' })
        query = query.eq(definition.parentFilter, payload.parent_id)
      }
      if (definition.onlyKeys) query = query.in('section_key', definition.onlyKeys)
      if (definition.keyPrefix) query = query.like('section_key', `${definition.keyPrefix}%`)
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
        query = query.order(column, { ascending: definition.orderDescending ? false : Boolean(definition.orderBy) || definition.workflow !== 'status' })
      }
      query = query.range(offset, offset + limit - 1)
      const { data, error, count } = await query
      if (error) return reply(500, { ok: false, error: 'database_error' })
      return reply(200, { ok: true, data: data || [], total: count ?? (data || []).length })
    }

    if (op === 'get') {
      if (!idOk(definition, payload.id)) return reply(400, { ok: false, error: 'invalid_id' })
      const row = await loadRow(db, definition, payload.id)
      if (!row || !belongsToType(definition, row)) return reply(404, { ok: false, error: 'not_found' })
      const data = publicRow(definition, row)
      if (payload.entity === 'pages' && !row.draft_of_id) {
        const { data: draft } = await db.from('pages').select('id').eq('draft_of_id', payload.id).maybeSingle()
        data.draft_id = draft?.id || null
      }
      if (payload.entity === 'pages' && row.slug) {
        const { data: override } = await db.from('seo_metadata').select('id, meta_title, meta_description, canonical_url, og_image').eq('page_slug', row.slug).maybeSingle()
        data.seo_override = override || null
      }
      if (payload.entity === 'home_lists') {
        // The editor builds its form from the list's shape (lines, or items with these fields).
        const list = HOME_LISTS[String(row.section_key).slice(HOME_LIST_PREFIX.length)]
        data.list_shape = list ? { strings: Boolean(list.strings), fields: list.strings ? [] : [...new Set(list.defaults.flatMap((item) => Object.keys(item)))] } : null
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
      if (!creating && (!existing || !belongsToType(definition, existing))) return reply(404, { ok: false, error: 'not_found' })
      if (payload.entity === 'home_lists' && values.items_json !== undefined) {
        const items = cleanHomeList(existing.section_key.slice(HOME_LIST_PREFIX.length), values.items_json)
        if (items === INVALID) return reply(400, { ok: false, error: 'validation_failed', details: ['items_json: does not match this list'] })
        values.items_json = items
      }
      if (definition.slugField && values.slug) {
        const { data: clashes } = await db.from(definition.table).select(payload.entity === 'pages' ? 'id, draft_of_id' : 'id').eq(definition.slugField, values.slug).neq('id', payload.id || '00000000-0000-0000-0000-000000000000').limit(5)
        // A page's private draft shares the live page's address by design, so the two never clash.
        const clash = (clashes || []).find((row) => !payload.id || (row.draft_of_id !== payload.id && row.id !== existing?.draft_of_id))
        if (clash) return reply(409, { ok: false, error: 'slug_taken', details: [`slug "${values.slug}" is already used by another ${payload.entity} record`] })
      }
      if (creating && definition.slugField && !values.slug) return reply(400, { ok: false, error: 'validation_failed', details: ['slug: required'] })
      if (definition.sharedAddressWith && values.slug) {
        if (RESERVED_SINGLE_SEGMENT_SLUGS.has(values.slug)) return reply(409, { ok: false, error: 'slug_taken', details: [`/${values.slug} is a fixed page of the website`] })
        const other = ENTITIES[definition.sharedAddressWith]
        const { data: clashOther } = await db.from(other.table).select('id').eq(other.slugField, values.slug).limit(1)
        if ((clashOther || []).length) return reply(409, { ok: false, error: 'slug_taken', details: [`slug "${values.slug}" is already used by a ${definition.sharedAddressWith === 'pages' ? 'page' : 'service page'}`] })
      }
      if (payload.entity === 'blogs' && values.content_json) values.content = blogPlainText(values.content_json)
      if (creating && definition.workflow !== 'none') Object.assign(values, definition.workflow === 'status' ? workflowFields(definition, 'draft') : activeFields(definition, false))
      if (definition.timestamps !== false) values.updated_at = new Date(now).toISOString()
      const result = creating
        ? await db.from(definition.table).insert(values).select('*').single()
        : await db.from(definition.table).update(values).eq('id', payload.id).select('*').single()
      if (result.error) return dbFail(deps, payload, result.error)
      await audit(deps, payload, creating ? 'create' : 'update', payload.entity, result.data.id, { fields: Object.keys(values) })
      const revalidation = await revalidate(deps, definition, result.data, existing && existing.slug !== result.data.slug ? existing.slug : '')
      return reply(200, { ok: true, data: publicRow(definition, result.data), revalidation })
    }

    if (op === 'upload') {
      if (payload.entity !== 'media') return reply(400, { ok: false, error: 'not_supported' })
      return await uploadMedia(db, deps, payload, now)
    }

    if (op === 'import_homepage_defaults') {
      if (payload.entity !== 'home_lists') return reply(400, { ok: false, error: 'not_supported' })
      return await importHomepageDefaults(db, deps, payload, now)
    }

    if (op === 'import_menu_defaults') {
      if (payload.entity !== 'menus') return reply(400, { ok: false, error: 'not_supported' })
      return await importMenuDefaults(db, deps, payload, now)
    }

    if (op === 'start_draft' && payload.entity !== 'pages') return reply(400, { ok: false, error: 'not_supported' })
    if (!idOk(definition, payload.id)) return reply(400, { ok: false, error: 'invalid_id' })
    const existing = await loadRow(db, definition, payload.id)
    if (!existing || !belongsToType(definition, existing)) return reply(404, { ok: false, error: 'not_found' })

    if (op === 'start_draft') {
      if (payload.entity !== 'pages') return reply(400, { ok: false, error: 'not_supported' })
      const result = await deps.startPageDraft(payload.id)
      if (!result.ok) return reply(result.status, { ok: false, error: 'draft_failed', details: [result.error] })
      await audit(deps, payload, 'start_draft', 'pages', result.draft.id, { live_id: payload.id })
      return reply(200, { ok: true, data: publicRow(definition, result.draft) })
    }

    let update = null
    if (definition.workflow === 'none' && ['set_status', 'trash', 'restore'].includes(op)) return reply(400, { ok: false, error: 'not_supported' })
    if (op === 'delete' && definition.workflow === 'none' && definition.deletable !== false) {
      if (payload.confirm !== true) return reply(400, { ok: false, error: 'confirmation_required' })
      for (const use of definition.inUseBy || []) {
        const { count } = await db.from(use.table).select('id', { count: 'exact', head: true }).eq(use.field, payload.id)
        if (Number(count) > 0) return reply(409, { ok: false, error: 'in_use', details: [`still used by ${count} ${use.label}`] })
      }
      const { error } = await db.from(definition.table).delete().eq('id', payload.id)
      if (error) return reply(500, { ok: false, error: 'database_error' })
      await audit(deps, payload, 'delete', payload.entity, payload.id, {})
      const revalidation = await revalidate(deps, definition, existing)
      return reply(200, { ok: true, data: { id: payload.id, deleted: true }, revalidation })
    }
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
    if (error) return dbFail(deps, payload, error)
    await audit(deps, payload, op, payload.entity, payload.id, update)
    const revalidation = await revalidate(deps, definition, data)
    return reply(200, { ok: true, data: publicRow(definition, data), revalidation })
  } catch (error) {
    deps.log?.('error', { op: payload.op, entity: payload.entity, error: error?.message || String(error) })
    return reply(500, { ok: false, error: 'internal_error' })
  }
}
