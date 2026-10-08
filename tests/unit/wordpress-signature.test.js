import test from 'node:test'
import assert from 'node:assert/strict'

import { signPayload, verifySignature } from '../../lib/wordpress/signature.js'

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef'
const BODY = '{"event_id":"3f1c2b9e-1111-4a5b-9c7d-000000000001","content_type":"blog","action":"upsert","slug":"ai-tools-for-marketers","previous_slug":null,"wordpress_id":42,"sent_at":"2026-10-02T10:00:00+00:00"}'
const TIMESTAMP = 1790935200
const NOW = TIMESTAMP * 1000

test('matches the signature produced by the WordPress plugin (PHP sign_payload fixture)', () => {
  // Generated with wordpress/acadvizen-cms/includes/config.php sign_payload() on PHP 8.3.
  const fromPhp = 'v1=c32e33b7272eabb437a1a1864d2041a4d847f34bb1a02ca9011084080e93bea8'
  assert.equal(signPayload(BODY, TIMESTAMP, SECRET), fromPhp)
  assert.deepEqual(verifySignature({ body: BODY, timestamp: String(TIMESTAMP), signature: fromPhp, secret: SECRET, now: NOW }), { ok: true, reason: null })
})

test('rejects a tampered body', () => {
  const signature = signPayload(BODY, TIMESTAMP, SECRET)
  const tampered = BODY.replace('ai-tools-for-marketers', 'about')
  assert.equal(verifySignature({ body: tampered, timestamp: TIMESTAMP, signature, secret: SECRET, now: NOW }).reason, 'invalid_signature')
})

test('rejects a signature made with a different secret', () => {
  const signature = signPayload(BODY, TIMESTAMP, 'another-secret-0123456789abcdef0123456789')
  assert.equal(verifySignature({ body: BODY, timestamp: TIMESTAMP, signature, secret: SECRET, now: NOW }).ok, false)
})

test('rejects requests outside the 5 minute window (replay protection)', () => {
  const signature = signPayload(BODY, TIMESTAMP, SECRET)
  assert.equal(verifySignature({ body: BODY, timestamp: TIMESTAMP, signature, secret: SECRET, now: NOW + 301_000 }).reason, 'stale_timestamp')
  assert.equal(verifySignature({ body: BODY, timestamp: TIMESTAMP, signature, secret: SECRET, now: NOW - 301_000 }).reason, 'stale_timestamp')
  assert.equal(verifySignature({ body: BODY, timestamp: TIMESTAMP, signature, secret: SECRET, now: NOW + 299_000 }).ok, true)
})

test('rejects missing or malformed headers and a missing secret', () => {
  const signature = signPayload(BODY, TIMESTAMP, SECRET)
  assert.equal(verifySignature({ body: BODY, timestamp: '', signature, secret: SECRET, now: NOW }).reason, 'missing_timestamp')
  assert.equal(verifySignature({ body: BODY, timestamp: TIMESTAMP, signature: 'sha256=abc', secret: SECRET, now: NOW }).reason, 'invalid_signature')
  assert.equal(verifySignature({ body: BODY, timestamp: TIMESTAMP, signature: '', secret: SECRET, now: NOW }).reason, 'invalid_signature')
  assert.equal(verifySignature({ body: BODY, timestamp: TIMESTAMP, signature, secret: '', now: NOW }).reason, 'not_configured')
})
