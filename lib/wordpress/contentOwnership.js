/**
 * Single source of truth for public website content (pure; safe for the Edge middleware).
 *
 * When WORDPRESS_OWNS_PUBLIC_CONTENT=true, the public website's content and design are managed
 * in the WordPress Master Admin, so the Main Website's own /admin may no longer change them:
 * writes (POST/PUT/PATCH/DELETE) to the public-content CMS APIs are refused with 423 Locked.
 * Reading keeps working, and application data (leads, users, LMS, uploads, audit log) is not
 * affected. Unset (the default), nothing changes.
 */

// /api/cms/<area> areas that author the public website's content, design, navigation and SEO.
export const WORDPRESS_OWNED_CMS_AREAS = new Set([
  'banners',
  'blogs',
  'bulk',
  'cities',
  'city-page-sections',
  'drafts',
  'duplicate',
  'entities',
  'footer',
  'header',
  'homepage',
  'import-live-pages',
  'internal-links',
  'location-sections',
  'menus',
  'pages',
  'popups',
  'redirects',
  'render-page',
  'robots',
  'scheduled-items',
  'sections',
  'seo',
  'service-page-sections',
  'settings',
  'site',
  'sitemap',
  'templates',
  'workflow',
])

// Generic /api/cms/entities/<entity> tables that are application data, not website content.
export const APPLICATION_ENTITIES = new Set(['roles', 'lms_modules', 'lms_lessons', 'student_metrics'])

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function isWordPressOwnershipEnabled(env = process.env) {
  return String(env.WORDPRESS_OWNS_PUBLIC_CONTENT || '').toLowerCase() === 'true'
}

/**
 * @returns {boolean} true when this request would change content that WordPress now owns
 */
export function isWordPressOwnedWrite({ method = 'GET', pathname = '', enabled = false }) {
  if (!enabled || !WRITE_METHODS.has(String(method).toUpperCase())) return false
  const match = String(pathname).match(/^\/api\/cms\/([a-z0-9-]+)(?:\/([a-z0-9_-]+))?/)
  if (!match || !WORDPRESS_OWNED_CMS_AREAS.has(match[1])) return false
  if (match[1] === 'entities') return Boolean(match[2]) && !APPLICATION_ENTITIES.has(match[2])
  return true
}

export const OWNED_CONTENT_MESSAGE = 'This content is managed in the WordPress Master Admin (Acadvizen Master Admin). Edit it there with WordPress and Elementor.'
