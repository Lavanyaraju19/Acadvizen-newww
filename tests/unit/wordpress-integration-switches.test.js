import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { getContentApiConfig, getSlugCheckConfig, getWordPressConfig } from '../../lib/wordpress/config.js'
import { handleSlugCheckRequest } from '../../lib/wordpress/webhook.js'
import { handleContentRequest } from '../../lib/wordpress/contentApi.js'
import { signPayload } from '../../lib/wordpress/signature.js'

// Two independent WordPress integrations (lib/wordpress/config.js): the signed content API
// (WORDPRESS_CONTENT_API_ENABLED, production) and WordPress reading / Render Bridge
// (WORDPRESS_CONTENT_ENABLED + WORDPRESS_CMS_API_URL, off in production). Neither turns the other on.
const SECRET = 'a-shared-secret-of-at-least-32-characters'
const URL_OK = 'https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1'
const CONTENT_ONLY = { WORDPRESS_CONTENT_API_ENABLED: 'true', WORDPRESS_CMS_WEBHOOK_SECRET: SECRET }
const READING_ONLY = { WORDPRESS_CONTENT_ENABLED: 'true', WORDPRESS_CMS_API_URL: URL_OK, WORDPRESS_CMS_WEBHOOK_SECRET: SECRET }
const NOW = Date.UTC(2026, 9, 12, 12, 0, 0)

function signed(payload, { secret = SECRET, at = NOW } = {}) {
  const rawBody = JSON.stringify(payload)
  const ts = Math.floor(at / 1000)
  return { rawBody, headers: new Headers({ 'x-acadvizen-timestamp': String(ts), 'x-acadvizen-signature': signPayload(rawBody, ts, secret) }) }
}

test('both integrations are off by default and for any value other than "true"', () => {
  for (const env of [{}, { WORDPRESS_CMS_WEBHOOK_SECRET: SECRET }]) {
    assert.equal(getContentApiConfig(env).enabled, false)
    assert.equal(getWordPressConfig(env).enabled, false)
    assert.equal(getSlugCheckConfig(env).enabled, false)
  }
  for (const value of ['TRUE', '1', 'yes', 'on', ' true', '']) {
    assert.equal(getContentApiConfig({ ...CONTENT_ONLY, WORDPRESS_CONTENT_API_ENABLED: value }).enabled, false, value)
    assert.equal(getWordPressConfig({ ...READING_ONLY, WORDPRESS_CONTENT_ENABLED: value }).enabled, false, value)
  }
})

test('the content API switch never turns on WordPress reading or the Render Bridge', () => {
  assert.equal(getContentApiConfig(CONTENT_ONLY).enabled, true)
  assert.equal(getWordPressConfig(CONTENT_ONLY).enabled, false)
  // Even with an API URL present, reading needs its own switch.
  assert.equal(getWordPressConfig({ ...CONTENT_ONLY, WORDPRESS_CMS_API_URL: URL_OK }).enabled, false)
})

test('the WordPress reading switch never turns on the content API', () => {
  assert.equal(getWordPressConfig(READING_ONLY).enabled, true)
  assert.equal(getContentApiConfig(READING_ONLY).enabled, false)
})

test('WordPress reading stays off with a missing or invalid API URL', () => {
  for (const url of [undefined, '', 'not a url', 'http://enroll.acadvizen.com/wp-json/acadvizen-cms/v1', 'ftp://enroll.acadvizen.com/x']) {
    assert.equal(getWordPressConfig({ ...READING_ONLY, WORDPRESS_CMS_API_URL: url }).enabled, false, String(url))
  }
})

test('a missing or short secret is treated as not configured by every integration', () => {
  for (const secret of [undefined, '', 'short', 'x'.repeat(31)]) {
    const env = { ...CONTENT_ONLY, ...READING_ONLY, WORDPRESS_CMS_WEBHOOK_SECRET: secret }
    assert.equal(getContentApiConfig(env).secret, '')
    assert.equal(getWordPressConfig(env).secret, '')
    assert.equal(getSlugCheckConfig(env).secret, '')
  }
  assert.equal(getContentApiConfig({ ...CONTENT_ONLY, WORDPRESS_CMS_WEBHOOK_SECRET: 'x'.repeat(32) }).secret, 'x'.repeat(32))
})

test('the slug check (also the plugin\'s "Test connection") answers when either integration is on', async () => {
  const ask = (env, request = signed({ content_type: 'page', path: '/acadvizen-connection-test' })) =>
    handleSlugCheckRequest({ ...request, config: getSlugCheckConfig(env), now: NOW, checkSlug: async () => null, checkPagePath: async () => null })
  for (const env of [CONTENT_ONLY, READING_ONLY]) {
    const ok = await ask(env)
    assert.equal(ok.status, 200)
    assert.equal(ok.body.ok, true)
  }
  assert.equal((await ask({})).status, 503)
  assert.equal((await ask({})).body.error, 'wordpress_content_disabled')
  assert.equal((await ask({ ...CONTENT_ONLY, WORDPRESS_CMS_WEBHOOK_SECRET: 'short' })).body.error, 'not_configured')
  // Signatures are still required: wrong secret, stale timestamp and unsigned requests are refused.
  assert.equal((await ask(CONTENT_ONLY, signed({ content_type: 'page', path: '/x' }, { secret: 'b'.repeat(40) }))).status, 401)
  assert.equal((await ask(CONTENT_ONLY, signed({ content_type: 'page', path: '/x' }, { at: NOW - 10 * 60 * 1000 }))).status, 401)
  assert.equal((await ask(CONTENT_ONLY, { rawBody: '{}', headers: new Headers() })).status, 401)
})

test('the content API refuses requests when only WordPress reading is on', async () => {
  const request = signed({ purpose: 'content', request_id: '0b5d0a3e-1f2a-4c3b-9d4e-5f6a7b8c9d0e', op: 'list', entity: 'pages' })
  const result = await handleContentRequest({ ...request, config: getContentApiConfig(READING_ONLY), deps: { db: {} }, now: NOW })
  assert.equal(result.status, 503)
  assert.equal(result.body.error, 'content_api_disabled')
})

test('routes use the switch of their own integration', () => {
  const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')
  assert.match(read('app/api/wordpress/content/route.js'), /config: getContentApiConfig\(\)/)
  assert.match(read('app/api/wordpress/slug-check/route.js'), /config: getSlugCheckConfig\(\)/)
  // Everything that reads from WordPress or serves its pages stays behind WORDPRESS_CONTENT_ENABLED.
  for (const p of ['src/middleware.js', 'app/wp-render/route.js', 'app/api/wordpress/bridge-manifest/route.js', 'app/api/wordpress/revalidate/route.js', 'lib/wordpress/blogs.js', 'lib/wordpress/bridge.js', 'lib/wordpress/proxy.js']) {
    const source = read(p)
    assert.match(source, /getWordPressConfig\(\)/, p)
    assert.doesNotMatch(source, /getContentApiConfig|getSlugCheckConfig|WORDPRESS_CONTENT_API_ENABLED/, p)
  }
})
