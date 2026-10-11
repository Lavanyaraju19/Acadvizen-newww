import { createHmac, timingSafeEqual } from 'node:crypto'

// Short-lived signed links from the WordPress central admin to Main's preview of an unpublished
// record: "preview-content.<entity>.<id>.<exp>" signed with the shared secret (same scheme as the
// PHP side, includes/main-content.php). Valid until <exp>, and never longer than an hour.
export const PREVIEW_MAX_SECONDS = 3600
export const PREVIEW_ENTITIES = ['pages', 'blogs']

export function signPreview({ entity, id, exp }, secret) {
  return createHmac('sha256', secret).update(`preview-content.${entity}.${id}.${exp}`).digest('hex')
}

export function verifyPreview({ entity, id, exp, sig }, secret, now = Date.now()) {
  if (!secret || secret.length < 32) return { ok: false, reason: 'not_configured' }
  if (!PREVIEW_ENTITIES.includes(entity)) return { ok: false, reason: 'unsupported_entity' }
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ''))) return { ok: false, reason: 'invalid_id' }
  const expires = Number(exp)
  const nowSeconds = Math.floor(now / 1000)
  if (!Number.isInteger(expires) || expires <= nowSeconds || expires > nowSeconds + PREVIEW_MAX_SECONDS) return { ok: false, reason: 'expired' }
  const provided = String(sig || '')
  if (!/^[0-9a-f]{64}$/.test(provided)) return { ok: false, reason: 'invalid_signature' }
  const expected = signPreview({ entity, id, exp: expires }, secret)
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected)) ? { ok: true } : { ok: false, reason: 'invalid_signature' }
}
