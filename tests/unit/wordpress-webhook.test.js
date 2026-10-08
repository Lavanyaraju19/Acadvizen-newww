import test from 'node:test'
import assert from 'node:assert/strict'

import { createEventDeduper, handleRevalidateRequest, handleSlugCheckRequest } from '../../lib/wordpress/webhook.js'
import { signPayload } from '../../lib/wordpress/signature.js'

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef'
const NOW = 1790935200 * 1000
const CONFIG = { enabled: true, secret: SECRET, apiUrl: 'https://wp.example/wp-json/acadvizen-cms/v1' }

function signedRequest(payload, { secret = SECRET, timestamp = NOW / 1000 } = {}) {
  const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return {
    rawBody,
    headers: new Headers({
      'x-acadvizen-timestamp': String(timestamp),
      'x-acadvizen-signature': signPayload(rawBody, timestamp, secret),
    }),
  }
}

function harness({ config = CONFIG, checkSlug = async () => ({ checked: true, conflict: false, reason: null }), deduper = createEventDeduper() } = {}) {
  const calls = { tags: [], paths: [], checked: [] }
  return {
    calls,
    run: (request) =>
      handleRevalidateRequest({
        ...request,
        config,
        now: NOW,
        deduper,
        revalidateTag: (tag) => calls.tags.push(tag),
        revalidatePath: (path) => calls.paths.push(path),
        checkSlug: async (slug) => {
          calls.checked.push(slug)
          return checkSlug(slug)
        },
      }),
  }
}

const upsert = (overrides = {}) => ({
  event_id: '3f1c2b9e-1111-4a5b-9c7d-000000000001',
  content_type: 'blog',
  action: 'upsert',
  slug: 'ai-tools-for-marketers',
  previous_slug: null,
  wordpress_id: 42,
  ...overrides,
})

test('a valid signed upsert revalidates exactly the affected blog tags and paths', async () => {
  const { calls, run } = harness()
  const result = await run(signedRequest(upsert({ previous_slug: 'old-ai-tools' })))
  assert.equal(result.status, 200)
  assert.equal(result.body.ok, true)
  assert.deepEqual(calls.tags, ['wordpress:blogs', 'wordpress:blog:ai-tools-for-marketers', 'wordpress:blog:old-ai-tools'])
  assert.deepEqual(calls.paths, ['/blog', '/blog/ai-tools-for-marketers', '/blog/old-ai-tools', '/sitemap.xml'])
  assert.deepEqual(result.body.slug_status, { checked: true, conflict: false, reason: null })
})

test('reports a slug conflict back to WordPress', async () => {
  const { run } = harness({ checkSlug: async () => ({ checked: true, conflict: true, reason: 'existing_blog' }) })
  const result = await run(signedRequest(upsert()))
  assert.equal(result.status, 200)
  assert.deepEqual(result.body.slug_status, { checked: true, conflict: true, reason: 'existing_blog' })
})

test('a slug-check failure does not fail the revalidation', async () => {
  const { calls, run } = harness({ checkSlug: async () => { throw new Error('db down') } })
  const result = await run(signedRequest(upsert()))
  assert.equal(result.status, 200)
  assert.equal(result.body.slug_status.checked, false)
  assert.ok(calls.tags.length > 0)
})

test('remove revalidates without a slug check', async () => {
  const { calls, run } = harness()
  const result = await run(signedRequest(upsert({ action: 'remove' })))
  assert.equal(result.status, 200)
  assert.deepEqual(calls.checked, [])
  assert.ok(calls.tags.includes('wordpress:blog:ai-tools-for-marketers'))
})

test('duplicate deliveries of the same event are acknowledged without revalidating again', async () => {
  const { calls, run } = harness()
  await run(signedRequest(upsert()))
  const tagCount = calls.tags.length
  const second = await run(signedRequest(upsert()))
  assert.equal(second.status, 200)
  assert.equal(second.body.duplicate, true)
  assert.equal(calls.tags.length, tagCount)
})

test('rejects unsigned, wrongly signed and stale requests without side effects', async () => {
  const { calls, run } = harness()
  const unsigned = await run({ rawBody: JSON.stringify(upsert()), headers: new Headers() })
  const wrongSecret = await run(signedRequest(upsert(), { secret: 'wrong-secret-0123456789abcdef0123456789ab' }))
  const stale = await run(signedRequest(upsert(), { timestamp: NOW / 1000 - 3600 }))
  assert.deepEqual([unsigned.status, wrongSecret.status, stale.status], [401, 401, 401])
  assert.equal(stale.body.error, 'stale_timestamp')
  assert.deepEqual(calls.tags, [])
  assert.deepEqual(calls.paths, [])
})

test('rejects malformed payloads', async () => {
  const { calls, run } = harness()
  const cases = [
    ['not json', 'invalid_json'],
    ['[1,2]', 'invalid_json'],
    [upsert({ content_type: 'course' }), 'unsupported_content_type'],
    [upsert({ action: 'delete-everything' }), 'invalid_action'],
    [upsert({ slug: '../../admin' }), 'invalid_slug'],
    [upsert({ slug: 'Has Spaces' }), 'invalid_slug'],
    [upsert({ previous_slug: 'bad slug' }), 'invalid_previous_slug'],
    [upsert({ event_id: 'x' }), 'invalid_event_id'],
  ]
  for (const [payload, error] of cases) {
    const result = await run(signedRequest(payload))
    assert.equal(result.status, 400, `expected 400 for ${error}`)
    assert.equal(result.body.error, error)
  }
  assert.deepEqual(calls.tags, [])
})

test('is closed when the integration is disabled or the secret is missing', async () => {
  const disabled = await harness({ config: { ...CONFIG, enabled: false } }).run(signedRequest(upsert()))
  const noSecret = await harness({ config: { ...CONFIG, secret: '' } }).run(signedRequest(upsert()))
  assert.equal(disabled.status, 503)
  assert.equal(disabled.body.error, 'wordpress_content_disabled')
  assert.equal(noSecret.status, 503)
})

test('rejects oversized bodies', async () => {
  const result = await harness().run(signedRequest(upsert({ padding: 'x'.repeat(20000) })))
  assert.equal(result.status, 413)
})

test('slug-check endpoint returns the Main Website slug status for a signed request', async () => {
  const result = await handleSlugCheckRequest({
    ...signedRequest({ content_type: 'blog', slug: 'seo-basics' }),
    config: CONFIG,
    now: NOW,
    checkSlug: async (slug) => ({ checked: true, conflict: slug === 'seo-basics', reason: 'existing_blog' }),
  })
  assert.equal(result.status, 200)
  assert.deepEqual(result.body, { ok: true, slug_status: { checked: true, conflict: true, reason: 'existing_blog' } })

  const unsigned = await handleSlugCheckRequest({ rawBody: '{}', headers: new Headers(), config: CONFIG, now: NOW, checkSlug: async () => null })
  assert.equal(unsigned.status, 401)
})

test('event deduper forgets events after its TTL', () => {
  const deduper = createEventDeduper({ ttlMs: 1000, maxEntries: 2 })
  deduper.add('a', 0)
  assert.equal(deduper.has('a', 500), true)
  assert.equal(deduper.has('a', 1500), false)
  deduper.add('b', 0)
  deduper.add('c', 0)
  assert.equal(deduper.has('a', 10), false, 'oldest entry evicted beyond maxEntries')
})

test('page publish revalidates the manifest and exactly the affected page addresses', async () => {
  const calls = { tags: [], paths: [], checked: [] }
  const result = await handleRevalidateRequest({
    ...signedRequest({ event_id: 'page-event-0001', content_type: 'page', action: 'upsert', path: '/neet-coaching', previous_path: '/neet' }),
    config: CONFIG,
    now: NOW,
    deduper: createEventDeduper(),
    revalidateTag: (tag) => calls.tags.push(tag),
    revalidatePath: (path) => calls.paths.push(path),
    checkSlug: async () => { throw new Error('blog checker must not be used for pages') },
    checkPagePath: async (path) => { calls.checked.push(path); return { checked: true, conflict: false, reason: null } },
  })
  assert.equal(result.status, 200)
  assert.deepEqual(calls.tags, ['wordpress:manifest', 'wordpress:page:/neet-coaching', 'wordpress:page:/neet'])
  assert.deepEqual(calls.paths, ['/neet-coaching', '/neet', '/sitemap.xml'])
  assert.deepEqual(calls.checked, ['/neet-coaching'])
})

test('page events with invalid addresses are rejected', async () => {
  for (const [payload, error] of [
    [{ path: '../admin' }, 'invalid_path'],
    [{ path: 'https://evil.example/' }, 'invalid_path'],
    [{ path: '/ok', previous_path: '/Bad Path' }, 'invalid_previous_path'],
  ]) {
    const result = await handleRevalidateRequest({
      ...signedRequest({ event_id: 'page-event-0002', content_type: 'page', action: 'upsert', ...payload }),
      config: CONFIG,
      now: NOW,
      revalidateTag: () => assert.fail('must not revalidate'),
      revalidatePath: () => assert.fail('must not revalidate'),
    })
    assert.equal(result.status, 400)
    assert.equal(result.body.error, error)
  }
})

test('slug-check for pages uses the page address checker', async () => {
  const result = await handleSlugCheckRequest({
    ...signedRequest({ content_type: 'page', path: '/about' }),
    config: CONFIG,
    now: NOW,
    checkPagePath: async () => ({ checked: true, conflict: true, reason: 'reserved' }),
  })
  assert.deepEqual(result.body, { ok: true, slug_status: { checked: true, conflict: true, reason: 'reserved' } })
})
