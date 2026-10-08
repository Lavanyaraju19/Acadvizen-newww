/**
 * Server-only configuration for the WordPress (enroll.acadvizen.com) content integration.
 *
 * WORDPRESS_CONTENT_ENABLED   "true" to show WordPress blogs on this site (anything else = off).
 * WORDPRESS_CMS_API_URL       e.g. https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1
 * WORDPRESS_CMS_WEBHOOK_SECRET  shared with ACADVIZEN_CMS_WEBHOOK_SECRET in wp-config.php (secret).
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
