import { getServerSupabaseClient } from './supabaseServer'
import {
  getPublicBlogTimestamp,
  isPublicBlogVisible,
  normalizePublicBlogEntry,
  sortPublicBlogs,
} from './blogVisibility'

const PUBLIC_BLOG_SELECT =
  'id,slug,title,description,excerpt,content,featured_image,image,published_at,created_at,updated_at,status,tags,categories,author,seo_title,seo_description,meta_title,meta_description,og_image,noindex,faq_schema,content_json'
const PUBLIC_BLOG_FALLBACK_SELECT =
  'id,slug,title,description,excerpt,content,featured_image,image,published_at,created_at,updated_at,status,tags,categories,author,seo_title,seo_description,meta_title,meta_description,og_image,noindex'
const PUBLIC_BLOG_MINIMAL_SELECT =
  'id,slug,title,description,content,featured_image,published_at,created_at,updated_at,status,tags,categories,author'

function normalizeLimit(limit, fallback = 100) {
  const parsed = Number(limit)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, 200)
}

function normalizeRows(rows = []) {
  return sortPublicBlogs(
    rows
      .map((row) => normalizePublicBlogEntry(row))
      .filter((row) => isPublicBlogVisible(row))
  )
}

function isMissingColumnError(error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('column') && message.includes('does not exist')
}

function buildBlogQuery(supabase, options = {}, selectClause = PUBLIC_BLOG_SELECT) {
  let query = supabase
    .from('blogs')
    .select(selectClause)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (options.slug) query = query.eq('slug', options.slug)
  if (options.id) query = query.eq('id', options.id)
  if (options.excludeId) query = query.neq('id', options.excludeId)
  if (!options.slug && !options.id) query = query.limit(normalizeLimit(options.limit, 100))
  if (options.limit && (options.slug || options.id)) query = query.limit(normalizeLimit(options.limit, 1))

  return query
}

export async function fetchPublishedPublicBlogs(options = {}) {
  const supabase = getServerSupabaseClient()
  if (!supabase) return []

  const selectCandidates = Array.from(
    new Set([
      options.select || PUBLIC_BLOG_SELECT,
      PUBLIC_BLOG_SELECT,
      PUBLIC_BLOG_FALLBACK_SELECT,
      PUBLIC_BLOG_MINIMAL_SELECT,
    ].filter(Boolean))
  )

  for (const selectClause of selectCandidates) {
    const { data, error } = await buildBlogQuery(supabase, options, selectClause)
    if (!error && Array.isArray(data)) {
      return normalizeRows(data)
    }

    if (!isMissingColumnError(error)) {
      return []
    }
  }

  return []
}

export async function fetchPublishedPublicBlogBySlug(slug) {
  const rows = await fetchPublishedPublicBlogs({ slug, limit: 1 })
  return rows[0] || null
}

export async function fetchRelatedPublishedBlogs(entry, limit = 3) {
  if (!entry?.id) return []
  const rows = await fetchPublishedPublicBlogs({ excludeId: entry.id, limit })
  return rows
}

export { PUBLIC_BLOG_SELECT, getPublicBlogTimestamp }
