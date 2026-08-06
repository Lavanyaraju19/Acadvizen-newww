import { createSlugRedirectRecord } from './redirects.js'

/**
 * Comprehensive slug generation and validation utilities
 */

export const MAX_SLUG_LENGTH = 100
export const RESERVED_SLUGS = new Set([
  'admin',
  'admin-login',
  'api',
  '_next',
  'login',
  'logout',
  'preview',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
])

function stripDiacritics(value = '') {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text) {
  if (!text) return ''

  return stripDiacritics(text)
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '')
}

/**
 * Sanitize a slug value as the user types directly into a slug field, keystroke by keystroke.
 *
 * generateSlug() strips a trailing hyphen because it's meant to be called once on a finished
 * string. Calling it on every keystroke of a field the user is typing directly into is a
 * different situation: the character just typed is always at the end of the string, so if that
 * character is a hyphen, generateSlug() strips it immediately - permanently, since the
 * sanitized (now-hyphen-less) result becomes the new input value and the next keystroke is
 * appended to that. No hyphen typed directly into such a field could ever survive. This variant
 * skips only the trailing-hyphen strip so a hyphen the user just typed stays put; run the value
 * through generateSlug() again on blur/save for the fully clean final form.
 */
export function generateSlugLive(text) {
  if (!text) return ''

  return stripDiacritics(text)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .slice(0, MAX_SLUG_LENGTH)
}

/**
 * Ensure slug uniqueness in a table
 */
export async function ensureUniqueSlug(supabase, tableName, slug, currentId = null) {
  let uniqueSlug = slug
  let counter = 1
  
  while (true) {
    let query = supabase
      .from(tableName)
      .select('id')
      .eq('slug', uniqueSlug)

    if (currentId) {
      query = query.neq('id', currentId)
    }

    const { data: existing } = await query.maybeSingle()
    
    if (!existing) {
      return uniqueSlug
    }
    
    uniqueSlug = `${slug}-${counter}`
    counter++
  }
}

/**
 * Create automatic redirect when slug changes
 */
export async function createSlugRedirect(supabase, oldSlug, newSlug, entityType = 'page') {
  if (!oldSlug || !newSlug || oldSlug === newSlug) {
    return null
  }

  return createSlugRedirectRecord(supabase, {
    fromPath: `/${oldSlug}`,
    toPath: `/${newSlug}`,
    statusCode: 301,
    entityType,
  })
}

/**
 * Validate slug format
 */
export function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required' }
  }

  const normalizedSlug = String(slug).trim().toLowerCase()

  if (normalizedSlug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' }
  }

  if (normalizedSlug.length > MAX_SLUG_LENGTH) {
    return { valid: false, error: `Slug must be less than ${MAX_SLUG_LENGTH + 1} characters` }
  }

  if (normalizedSlug.includes('/') || normalizedSlug.includes('\\')) {
    return { valid: false, error: 'Slug cannot contain slashes' }
  }

  if (normalizedSlug.includes('..') || /%2f|%5c|%2e/i.test(normalizedSlug)) {
    return { valid: false, error: 'Slug contains unsafe path characters' }
  }

  if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' }
  }

  if (normalizedSlug.startsWith('-') || normalizedSlug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with a hyphen' }
  }

  if (normalizedSlug.includes('--')) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' }
  }

  if (RESERVED_SLUGS.has(normalizedSlug)) {
    return { valid: false, error: 'Slug conflicts with a reserved application route' }
  }

  return { valid: true }
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(baseUrl, slug, entityType = 'page') {
  const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug
  return `${baseUrl}/${cleanSlug}`
}
