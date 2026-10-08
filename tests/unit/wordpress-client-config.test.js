import test from 'node:test'
import assert from 'node:assert/strict'

import { getWordPressConfig } from '../../lib/wordpress/config.js'
import { WordPressRequestError, wordpressGetJson } from '../../lib/wordpress/client.js'

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef'

test('integration is off unless explicitly enabled with a valid https API URL', () => {
  assert.equal(getWordPressConfig({}).enabled, false)
  assert.equal(getWordPressConfig({ WORDPRESS_CONTENT_ENABLED: 'true' }).enabled, false)
  assert.equal(getWordPressConfig({ WORDPRESS_CONTENT_ENABLED: 'yes', WORDPRESS_CMS_API_URL: 'https://wp.example/wp-json/acadvizen-cms/v1' }).enabled, false)
  assert.equal(getWordPressConfig({ WORDPRESS_CONTENT_ENABLED: 'true', WORDPRESS_CMS_API_URL: 'http://wp.example/wp-json/acadvizen-cms/v1' }).enabled, false)

  const config = getWordPressConfig({
    WORDPRESS_CONTENT_ENABLED: 'true',
    WORDPRESS_CMS_API_URL: 'https://wp.example/wp-json/acadvizen-cms/v1/',
    WORDPRESS_CMS_WEBHOOK_SECRET: SECRET,
  })
  assert.deepEqual(config, {
    enabled: true,
    apiUrl: 'https://wp.example/wp-json/acadvizen-cms/v1',
    origin: 'https://wp.example',
    hostname: 'wp.example',
    secret: SECRET,
  })
})

test('short secrets are treated as not configured', () => {
  assert.equal(getWordPressConfig({ WORDPRESS_CMS_WEBHOOK_SECRET: 'short' }).secret, '')
})

const CONFIG = { apiUrl: 'https://wp.example/wp-json/acadvizen-cms/v1' }
const jsonResponse = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

test('client returns data, and returns (not throws) 404', async () => {
  const ok = await wordpressGetJson(CONFIG, '/blogs', { fetchImpl: async () => jsonResponse(200, { items: [] }) })
  assert.deepEqual(ok.data, { items: [] })
  const missing = await wordpressGetJson(CONFIG, '/blogs/x', { fetchImpl: async () => jsonResponse(404, { code: 'acv_cms_not_found' }) })
  assert.equal(missing.status, 404)
  assert.equal(missing.data, null)
})

test('client throws on server errors, invalid JSON, network errors and timeouts so failures are never cached', async () => {
  await assert.rejects(wordpressGetJson(CONFIG, '/blogs', { fetchImpl: async () => jsonResponse(500, {}) }), WordPressRequestError)
  await assert.rejects(wordpressGetJson(CONFIG, '/blogs', { fetchImpl: async () => new Response('<html>', { status: 200 }) }), WordPressRequestError)
  await assert.rejects(wordpressGetJson(CONFIG, '/blogs', { fetchImpl: async () => { throw new TypeError('fetch failed') } }), WordPressRequestError)
  const hanging = (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))))
  await assert.rejects(wordpressGetJson(CONFIG, '/blogs', { fetchImpl: hanging, timeoutMs: 20 }), /timed out/)
  await assert.rejects(wordpressGetJson({}, '/blogs'), /not configured/)
})
