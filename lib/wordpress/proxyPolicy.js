/**
 * Which WordPress endpoints the Main Website forwards for WordPress-rendered pages (pure).
 *
 * Elementor forms and form plugins run in WordPress (PHP). On www.acadvizen.com their browser
 * code calls /wp-json/... and /wp-admin/admin-ajax.php on the same origin; the Main Website
 * forwards ONLY these known form endpoints to WordPress. Everything else under those paths
 * returns 404, so the rest of the WordPress API is not exposed through the Main Website.
 *
 * A newly installed plugin that needs another endpoint can be allowed without code changes:
 *   WORDPRESS_PROXY_EXTRA_REST_ROUTES="POST metform/v1/entries/insert/*,GET some/v1/thing"
 *   WORDPRESS_PROXY_EXTRA_AJAX_ACTIONS="some_plugin_submit,another_action"
 */
import { signPayload } from './signature.js'

const BUILT_IN_REST_ROUTES = [
  // Existing Acadvizen enquiry API (contract unchanged; forwarded as-is).
  ['POST', /^acadvizen\/v1\/enquiry\/?$/],
  // Contact Form 7
  ['POST', /^contact-form-7\/v1\/contact-forms\/\d+\/feedback\/?$/],
  ['GET', /^contact-form-7\/v1\/contact-forms\/\d+\/feedback\/schema\/?$/],
  ['GET', /^contact-form-7\/v1\/contact-forms\/\d+\/refill\/?$/],
  // MetForm
  ['POST', /^metform\/v1\/entries\/insert\/\d+\/?$/],
  ['GET', /^metform\/v1\/forms\/views\/\d+\/?$/],
]

// Elementor Pro form submissions.
const BUILT_IN_AJAX_ACTIONS = ['elementor_pro_forms_send_form']

function escapeRoutePattern(pattern) {
  return new RegExp(`^${pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+')}/?$`)
}

export function parseExtraRestRoutes(value = '') {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().split(/\s+/))
    .filter(([method, route]) => ['GET', 'POST'].includes(method) && /^[a-z0-9-]+\/v\d+\/[a-z0-9\-/*]+$/i.test(route || ''))
    .map(([method, route]) => [method, escapeRoutePattern(route)])
}

export function parseExtraAjaxActions(value = '') {
  return String(value || '')
    .split(',')
    .map((action) => action.trim())
    .filter((action) => /^[a-z0-9_-]{3,80}$/i.test(action))
}

export function isAllowedRestRoute(method, route, env = process.env) {
  const normalized = String(route || '').replace(/^\/+/, '')
  if (normalized.includes('..')) return false
  const rules = [...BUILT_IN_REST_ROUTES, ...parseExtraRestRoutes(env.WORDPRESS_PROXY_EXTRA_REST_ROUTES)]
  return rules.some(([allowedMethod, pattern]) => allowedMethod === method && pattern.test(normalized))
}

export function isAllowedAjaxAction(action, env = process.env) {
  return [...BUILT_IN_AJAX_ACTIONS, ...parseExtraAjaxActions(env.WORDPRESS_PROXY_EXTRA_AJAX_ACTIONS)].includes(String(action || ''))
}

const FORWARDED_REQUEST_HEADERS = ['accept', 'accept-language', 'content-type', 'user-agent', 'x-requested-with', 'x-wp-nonce', 'referer']

export const CLIENT_IP_HEADER = 'x-acadvizen-client-ip'
export const CLIENT_IP_TIMESTAMP_HEADER = 'x-acadvizen-client-ts'
export const CLIENT_IP_SIGNATURE_HEADER = 'x-acadvizen-client-sig'

/**
 * WordPress sees the Main Website's server address, not the visitor's, so per-visitor rate limits
 * and spam checks in form plugins would treat every visitor as one. The visitor's IP is sent with a
 * signature ("client-ip.<ip>", shared secret); the WordPress plugin only trusts it when it verifies.
 */
export function signedClientIpHeaders(clientIp, secret, now = Date.now()) {
  if (!clientIp || clientIp === 'unknown' || !secret) return {}
  const timestamp = String(Math.floor(now / 1000))
  return {
    [CLIENT_IP_HEADER]: clientIp,
    [CLIENT_IP_TIMESTAMP_HEADER]: timestamp,
    [CLIENT_IP_SIGNATURE_HEADER]: signPayload(`client-ip.${clientIp}`, timestamp, secret),
  }
}

export function buildForwardHeaders(incoming, clientIp, secret = '', now = Date.now()) {
  const headers = {}
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = incoming.get(name)
    if (value) headers[name] = value
  }
  if (clientIp) headers['x-forwarded-for'] = clientIp
  return { ...headers, ...signedClientIpHeaders(clientIp, secret, now) }
}
