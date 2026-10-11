// Privacy check for single-segment CMS page addresses, used by src/middleware.js before a page
// renders: an existing but unpublished page answers a plain 404 instead of leaking its content.
// Kept free of Next.js imports so it can be unit-tested (tests/unit/cms-page-privacy.test.js).

// Application routes that are never CMS pages, so they never need the lookup.
export const RESERVED_SINGLE_SEGMENT_SLUGS = new Set([
  'about',
  'achievements',
  'admin',
  'admin-login',
  'api',
  'blog',
  'contact',
  'courses',
  'dashboard',
  'forgot-password',
  'hire-from-us',
  'login',
  'maintenance',
  'placement',
  'privacy-policy',
  'projects',
  'register',
  'sales',
  'soft-skills',
  'terms-of-service',
  'testimonials',
  'tools',
])

export function isSingleCmsSlugPath(pathname = '') {
  const segments = String(pathname || '').split('/').filter(Boolean)
  if (segments.length !== 1) return false
  const slug = segments[0]
  if (!slug || slug.includes('.')) return false
  return !RESERVED_SINGLE_SEGMENT_SLUGS.has(slug)
}

/**
 * Looks up the page stored at `pathname` through Supabase's REST API.
 * @returns {Promise<null | { exists: true, published: boolean }>} null when the address is not a
 *   CMS page address, no page is stored there, or the lookup failed (the page route decides then).
 */
export async function fetchCmsPagePrivacy(pathname, { supabaseUrl, key, fetchImpl = fetch } = {}) {
  if (!isSingleCmsSlugPath(pathname)) return null
  if (!supabaseUrl || !key) return null

  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const lookup = (excludeDraftCopies) => {
    const url = new URL('/rest/v1/pages', supabaseUrl)
    url.searchParams.set('select', 'id,slug,status')
    url.searchParams.set('slug', `eq.${slug}`)
    // A live page's private draft copy (staged editing) shares its slug; it must not make the
    // live page look unpublished.
    if (excludeDraftCopies) url.searchParams.set('draft_of_id', 'is.null')
    url.searchParams.set('limit', '1')
    return fetchImpl(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
  }

  let response = await lookup(true)
  // Databases without the staged-editing migration have no draft_of_id column (and no copies).
  if (response.status === 400) response = await lookup(false)
  if (!response.ok) return null

  const rows = await response.json().catch(() => [])
  const page = Array.isArray(rows) ? rows[0] : null
  if (!page?.id) return null
  return {
    exists: true,
    published: String(page.status || '').toLowerCase() === 'published',
  }
}

/** True when the middleware must answer 404: a page is stored at the address but is not published. */
export function shouldHidePage(privacy) {
  return Boolean(privacy?.exists && !privacy.published)
}
