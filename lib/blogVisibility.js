import { canonicalizeKnownBlogSlug } from './blogSlugResolver.js'

export function isAutomatedTestBlog(entry = {}) {
  const title = String(entry?.title || '').trim()
  const slug = String(entry?.slug || '').trim().toLowerCase()
  const excerpt = String(entry?.description || entry?.excerpt || '').trim().toLowerCase()

  if (/^local e2e admin blog test\b/i.test(title)) return true
  if (/^local-\d{8,}$/i.test(slug) && excerpt.includes('local runtime testing')) return true
  return false
}

export function normalizeBlogStatus(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'published' || normalized === 'publish' || normalized === 'live' || normalized === 'active') {
    return 'published'
  }
  if (normalized === 'draft' || normalized === 'unpublished' || normalized === 'archived' || normalized === 'deleted') {
    return normalized
  }
  return normalized
}

export function getPublicBlogTimestamp(entry = {}) {
  return entry?.published_at || entry?.publishedAt || entry?.created_at || entry?.createdAt || null
}

export function isValidPublicBlogSlug(slug = '') {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug || '').trim())
}

export function normalizePublicBlogEntry(entry = {}) {
  const slug = canonicalizeKnownBlogSlug(entry?.slug || '')
  return {
    ...entry,
    slug,
    status: normalizeBlogStatus(entry?.status),
  }
}

export function isPublicBlogVisible(entry = {}, options = {}) {
  const normalized = normalizePublicBlogEntry(entry)
  const now = options.now instanceof Date ? options.now : new Date()
  const publishedTimestamp = getPublicBlogTimestamp(normalized)
  const publishedDate = publishedTimestamp ? new Date(publishedTimestamp) : null

  if (isAutomatedTestBlog(normalized)) return false
  if (normalizeBlogStatus(normalized.status) !== 'published') return false
  if (!normalized.slug || !isValidPublicBlogSlug(normalized.slug)) return false
  if (normalized.deleted_at || normalized.deletedAt || normalized.is_deleted === true) return false
  if (!publishedDate || Number.isNaN(publishedDate.getTime())) return false
  if (publishedDate.getTime() > now.getTime()) return false
  return true
}

export function sortPublicBlogs(entries = []) {
  return [...entries].sort((left, right) => {
    const leftTime = new Date(getPublicBlogTimestamp(left) || 0).getTime()
    const rightTime = new Date(getPublicBlogTimestamp(right) || 0).getTime()
    return rightTime - leftTime
  })
}
