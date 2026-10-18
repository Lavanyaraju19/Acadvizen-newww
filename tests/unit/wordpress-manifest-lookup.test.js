import test from 'node:test'
import assert from 'node:assert/strict'
import { createManifestLookup } from '../../lib/wordpress/manifestLookup.js'

// The Render Bridge manifest lookup in the middleware (lib/wordpress/manifestLookup.js): a slow or
// failing WordPress must never hold a Main page up.
const MANIFEST = { pages: [{ path: '/lp/x' }], redirects: [] }
const clock = () => { let t = 1_000_000; return { now: () => t, advance: (ms) => { t += ms } } }
const never = (signal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))

test('a good answer is reused for the TTL, then fetched again', async () => {
  const c = clock(); let calls = 0
  const lookup = createManifestLookup({ load: async () => { calls++; return MANIFEST }, now: c.now, ttlMs: 30_000 })
  assert.deepEqual(await lookup(), MANIFEST)
  c.advance(29_000); await lookup()
  assert.equal(calls, 1)
  c.advance(2_000); await lookup()
  assert.equal(calls, 2)
})

test('a slow WordPress is abandoned after the time limit and the request goes on', async () => {
  let aborted = false
  const lookup = createManifestLookup({ load: (signal) => { signal.addEventListener('abort', () => { aborted = true }); return never(signal) }, timeoutMs: 50 })
  const t0 = Date.now()
  assert.equal(await lookup(), null)
  assert.ok(Date.now() - t0 < 1_000, 'returned within the time limit')
  assert.equal(aborted, true, 'the slow request is cancelled')
})

test('after a timeout there is no retry, and the failure is remembered briefly', async () => {
  const c = clock(); let calls = 0
  const lookup = createManifestLookup({ load: (signal) => { calls++; return never(signal) }, now: c.now, timeoutMs: 20, failureTtlMs: 10_000 })
  await lookup()
  assert.equal(calls, 1, 'no second attempt after a timeout')
  c.advance(5_000); await lookup()
  assert.equal(calls, 1, 'not asked again within the failure window')
  c.advance(6_000); await lookup()
  assert.equal(calls, 2, 'asked again after the failure window')
})

test('an error (not a timeout) gets one immediate retry, for a new instance starting up', async () => {
  let calls = 0
  const lookup = createManifestLookup({ load: async () => { calls++; if (calls === 1) throw new Error('starting'); return MANIFEST } })
  assert.deepEqual(await lookup(), MANIFEST)
  assert.equal(calls, 2)
})

test('the last good manifest is kept while WordPress fails', async () => {
  const c = clock(); let ok = true
  const lookup = createManifestLookup({ load: async () => { if (!ok) throw new Error('down'); return MANIFEST }, now: c.now, ttlMs: 1_000 })
  assert.deepEqual(await lookup(), MANIFEST)
  ok = false; c.advance(2_000)
  assert.deepEqual(await lookup(), MANIFEST, 'Bridge pages keep their last known addresses')
})

test('requests that arrive together share one lookup', async () => {
  let calls = 0
  const lookup = createManifestLookup({ load: async () => { calls++; await new Promise((r) => setTimeout(r, 30)); return MANIFEST } })
  const answers = await Promise.all(Array.from({ length: 8 }, () => lookup()))
  assert.equal(calls, 1)
  assert.ok(answers.every((a) => a === MANIFEST))
})
