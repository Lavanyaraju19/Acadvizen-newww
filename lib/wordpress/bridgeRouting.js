/**
 * Render Bridge routing rules (pure; safe for the Edge middleware runtime).
 *
 * Decides whether a Main Website request is served by a WordPress/Elementor-rendered page.
 * Existing Main Website routes always win, unless an administrator explicitly ticked
 * "Replace an existing Main Website page" for that page in WordPress (always the case for the
 * Main homepage). Application routes (admin, auth, API, dashboards) can never be replaced.
 */

// Top-level route segments owned by this Next.js application (see app/ and app/(public)/).
// tests/unit/wordpress-bridge-routing.test.js fails if a new route folder is not listed here.
export const MAIN_ROUTE_SEGMENTS = new Set([
  'about',
  'achievements',
  'admin',
  'admin-dashboard',
  'admin-login',
  'ai-digital-marketing-course',
  'api',
  'blog',
  'companies',
  'contact',
  'courses',
  'dashboard',
  'digital-marketing-course-in-bangalore',
  'digital-marketing-course-in-jayanagar',
  'digital-marketing-internship-in-bangalore',
  'explore-programs',
  'forgot-password',
  'google-ads-course-in-bangalore',
  'hire-from-us',
  'internships',
  'legacy-fallback',
  'login',
  'maintenance',
  'placement',
  'preview',
  'privacy-policy',
  'projects',
  'register',
  'resources',
  'sales',
  'seo-course-in-bangalore',
  'social-media-marketing-course-in-bangalore',
  'soft-skills',
  'terms-of-service',
  'testimonials',
  'tools',
  'wp-render',
])

// Never served from WordPress, even with "replace": application, auth and proxy paths.
export const NEVER_REPLACEABLE_SEGMENTS = new Set([
  'admin',
  'admin-dashboard',
  'admin-login',
  'api',
  'dashboard',
  'forgot-password',
  'login',
  'maintenance',
  'preview',
  'register',
  'sales',
  'wp-admin',
  'wp-content',
  'wp-includes',
  'wp-json',
  'wp-render',
  '_acv',
  '_next',
])

// Single-segment programmatic SEO routes resolved by app/(public)/[slug] for any suffix.
export const MAIN_SLUG_PREFIXES = ['digital-marketing-course-', 'digital-marketing-courses-']

const PATH_PATTERN = /^(\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/

export function normalizeBridgePath(pathname = '') {
  const value = String(pathname || '').trim()
  if (!value || value === '/') return '/'
  const trimmed = `/${value.replace(/^\/+|\/+$/g, '')}`
  return trimmed
}

export function isValidBridgePath(path = '') {
  return path === '/' || (PATH_PATTERN.test(path) && path.length <= 300)
}

/**
 * @returns {'reserved' | 'homepage' | null} why a path belongs to the Main application, if it does
 */
export function mainOwnedReason(path = '') {
  if (path === '/') return 'homepage'
  const segments = path.split('/').filter(Boolean)
  const first = segments[0] || ''
  if (MAIN_ROUTE_SEGMENTS.has(first) || NEVER_REPLACEABLE_SEGMENTS.has(first)) return 'reserved'
  if (segments.length === 1 && MAIN_SLUG_PREFIXES.some((prefix) => first.startsWith(prefix))) return 'reserved'
  return null
}

export function isNeverReplaceable(path = '') {
  const first = path.split('/').filter(Boolean)[0] || ''
  return NEVER_REPLACEABLE_SEGMENTS.has(first)
}

/**
 * @param {object} args
 * @param {string} args.pathname request path
 * @param {{pages: Array, redirects: Array} | null} args.manifest WordPress manifest (null = unknown)
 * @param {boolean} args.mainPageExists an existing Main (Supabase) CMS page uses this exact address
 * @returns {{action: 'none'} | {action: 'bridge', entry: object} | {action: 'redirect', to: string}}
 */
export function decideBridgeRoute({ pathname, manifest, mainPageExists = false }) {
  const path = normalizeBridgePath(pathname)
  if (!manifest || !isValidBridgePath(path) || isNeverReplaceable(path)) return { action: 'none' }

  const entry = Array.isArray(manifest.pages) ? manifest.pages.find((page) => page?.path === path) : null
  if (entry) {
    if (entry.replace === true) return { action: 'bridge', entry }
    if (mainOwnedReason(path) || mainPageExists) return { action: 'none' }
    return { action: 'bridge', entry }
  }

  const moved = Array.isArray(manifest.redirects) ? manifest.redirects.find((r) => r?.from === path) : null
  if (moved && isValidBridgePath(moved.to) && !mainOwnedReason(path) && !mainPageExists) {
    return { action: 'redirect', to: moved.to }
  }
  return { action: 'none' }
}
