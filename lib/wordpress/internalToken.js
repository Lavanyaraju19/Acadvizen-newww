/**
 * Token that proves a request to /wp-render or /api/wordpress/bridge-manifest came from this
 * application's own middleware (the routes are internal rewrite targets, never public URLs).
 * Derived from the WordPress shared secret with Web Crypto, so it works in the Edge middleware
 * runtime and in Node route handlers, and never needs its own environment variable.
 */

export const INTERNAL_HEADER = 'x-acadvizen-bridge-internal'
// Set by the middleware next to INTERNAL_HEADER; only trusted when that token is valid.
export const PATH_HEADER = 'x-acadvizen-bridge-path'

const cache = new Map()

export function deriveInternalToken(secret) {
  if (!secret) return Promise.resolve('')
  if (!cache.has(secret)) {
    const encoder = new TextEncoder()
    cache.set(
      secret,
      globalThis.crypto.subtle
        .importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
        .then((key) => globalThis.crypto.subtle.sign('HMAC', key, encoder.encode('acadvizen-bridge-internal')))
        .then((buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join(''))
    )
  }
  return cache.get(secret)
}

export function constantTimeEqual(a = '', b = '') {
  const left = String(a)
  const right = String(b)
  let diff = left.length ^ right.length
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0)
  }
  return diff === 0
}

export async function isInternalRequest(request, secret) {
  const expected = await deriveInternalToken(secret)
  return Boolean(expected) && constantTimeEqual(request.headers.get(INTERNAL_HEADER) || '', expected)
}
