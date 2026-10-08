import { createHmac, timingSafeEqual } from 'node:crypto'

// Must match sign_payload() in wordpress/acadvizen-cms/includes/config.php:
//   X-Acadvizen-Timestamp: <unix seconds>
//   X-Acadvizen-Signature: v1=<hex HMAC-SHA256(secret, "<timestamp>.<raw body>")>
export const SIGNATURE_HEADER = 'x-acadvizen-signature'
export const TIMESTAMP_HEADER = 'x-acadvizen-timestamp'
export const SIGNATURE_TOLERANCE_SECONDS = 300

export function signPayload(body, timestamp, secret) {
  return `v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`
}

export function verifySignature({ body, timestamp, signature, secret, now = Date.now() }) {
  if (!secret) return { ok: false, reason: 'not_configured' }

  const timestampText = String(timestamp || '')
  if (!/^\d{9,12}$/.test(timestampText)) return { ok: false, reason: 'missing_timestamp' }
  if (Math.abs(now / 1000 - Number(timestampText)) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'stale_timestamp' }
  }

  const provided = String(signature || '')
  if (!/^v1=[a-f0-9]{64}$/.test(provided)) return { ok: false, reason: 'invalid_signature' }

  const expected = signPayload(String(body ?? ''), timestampText, secret)
  const matches = timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  return matches ? { ok: true, reason: null } : { ok: false, reason: 'invalid_signature' }
}
