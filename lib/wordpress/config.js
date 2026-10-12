/**
 * Server-only configuration for the two WordPress (enroll.acadvizen.com) integrations. Each has its
 * own switch, each fails closed, and neither switch ever turns the other one on:
 *
 * 1. Content API: WordPress edits this site's own records (Acadvizen Master Admin → Main Website),
 *    drawn by Next.js in this site's design. Signed requests to /api/wordpress/content.
 *    WORDPRESS_CONTENT_API_ENABLED  "true" to accept them (anything else = off).
 *
 * 2. WordPress reading (optional, off in production): WordPress blogs shown on this site and the
 *    Render Bridge that serves Elementor pages at this site's addresses (middleware, /wp-render).
 *    WORDPRESS_CONTENT_ENABLED      "true" to turn it on (anything else = off).
 *    WORDPRESS_CMS_API_URL          e.g. https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1
 *
 * WORDPRESS_CMS_WEBHOOK_SECRET  shared with ACADVIZEN_CMS_WEBHOOK_SECRET in wp-config.php (secret,
 *                               at least 32 characters); used by both.
 *
 * None of these are NEXT_PUBLIC_, so they never reach the browser.
 */

export const MIN_WEBHOOK_SECRET_LENGTH = 32

function parseApiUrl(value = '') {
  const raw = String(value || '').trim().replace(/\/+$/, '')
  if (!raw) return null
  try {
    const url = new URL(raw)
    const isLocal = ['localhost', '127.0.0.1', 'host.docker.internal'].includes(url.hostname)
    if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) return null
    return { apiUrl: raw, origin: url.origin, hostname: url.hostname }
  } catch {
    return null
  }
}

export function getWordPressConfig(env = process.env) {
  const parsed = parseApiUrl(env.WORDPRESS_CMS_API_URL)
  const secret = String(env.WORDPRESS_CMS_WEBHOOK_SECRET || '')
  return {
    enabled: env.WORDPRESS_CONTENT_ENABLED === 'true' && Boolean(parsed),
    apiUrl: parsed?.apiUrl || '',
    origin: parsed?.origin || '',
    hostname: parsed?.hostname || '',
    secret: secret.length >= MIN_WEBHOOK_SECRET_LENGTH ? secret : '',
  }
}

/** Integration 1: the signed content API. Does not depend on (or enable) WordPress reading. */
export function getContentApiConfig(env = process.env) {
  const secret = String(env.WORDPRESS_CMS_WEBHOOK_SECRET || '')
  return {
    enabled: env.WORDPRESS_CONTENT_API_ENABLED === 'true',
    secret: secret.length >= MIN_WEBHOOK_SECRET_LENGTH ? secret : '',
  }
}

/**
 * /api/wordpress/slug-check is a signed, read-only question ("is this address already used on the
 * Main Website?"). The plugin asks it before Render Bridge publishes and for its "Test connection"
 * button, so it answers when EITHER integration is on, with the same shared secret. It reads no
 * WordPress content and changes nothing; every Render Bridge path still requires integration 2.
 */
export function getSlugCheckConfig(env = process.env) {
  const reading = getWordPressConfig(env)
  const contentApi = getContentApiConfig(env)
  return { ...reading, enabled: reading.enabled || contentApi.enabled, secret: reading.secret }
}
