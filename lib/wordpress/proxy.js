/**
 * Forwards an allowed form request from a WordPress-rendered page on the Main Website to
 * WordPress (server-side). Cookies are never forwarded in either direction.
 */
import { getWordPressConfig } from './config.js'
import { buildForwardHeaders } from './proxyPolicy.js'
import { RateLimiter } from '../rateLimiter'

const MAX_BODY_BYTES = 4 * 1024 * 1024
const TIMEOUT_MS = 20000
const proxyLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 30, keyPrefix: 'wp-proxy' }, 'wp-proxy')

function plain(status, message) {
  return new Response(JSON.stringify({ code: 'acadvizen_proxy', message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })
}

/**
 * @param {Request} request incoming request
 * @param {string} targetPath WordPress path, e.g. /wp-json/contact-form-7/v1/...
 * @param {ArrayBuffer|undefined} body already-read request body (POST)
 */
export async function forwardToWordPress(request, targetPath, body) {
  const config = getWordPressConfig()
  if (!config.enabled || !config.origin) return plain(404, 'Not found')

  const clientIp = proxyLimiter.getClientIP(request)
  const limit = proxyLimiter.check(clientIp)
  if (!limit.allowed) return plain(429, 'Too many requests. Please wait a minute and try again.')
  if (body && body.byteLength > MAX_BODY_BYTES) return plain(413, 'The submission is too large.')

  const search = new URL(request.url).search
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const upstream = await fetch(`${config.origin}${targetPath}${search}`, {
      method: request.method,
      headers: buildForwardHeaders(request.headers, clientIp, config.secret),
      body: body && body.byteLength ? body : undefined,
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    })
    const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' })
    const contentType = upstream.headers.get('content-type')
    if (contentType) headers.set('Content-Type', contentType)
    return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers })
  } catch (error) {
    console.error('[wordpress-proxy] Forward failed.', { targetPath, reason: error?.name === 'AbortError' ? 'timeout' : error?.message })
    return plain(502, 'The form could not be sent right now. Please try again.')
  } finally {
    clearTimeout(timer)
  }
}
