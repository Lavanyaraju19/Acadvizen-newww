import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAnalyticsSnippets, injectAfterBodyOpen, injectBeforeHeadClose, prepareBridgedDocument } from '../../lib/wordpress/document.js'
import { constantTimeEqual, deriveInternalToken, isInternalRequest, INTERNAL_HEADER } from '../../lib/wordpress/internalToken.js'
import { buildForwardHeaders, isAllowedAjaxAction, isAllowedRestRoute, parseExtraRestRoutes } from '../../lib/wordpress/proxyPolicy.js'
import { sanitizeManifest } from '../../lib/wordpress/manifest.js'
import { signPayload } from '../../lib/wordpress/signature.js'

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef'

test('render/manifest request signatures match the WordPress plugin (PHP fixtures)', () => {
  // Generated with wordpress/acadvizen-cms/includes/config.php sign_payload() on PHP 8.3.
  assert.equal(signPayload('render./neet-coaching', 1790935200, SECRET), 'v1=6e2aab09b60cdcdd9865e2a919df4a45731614705c96c43f617b7174e9266a04')
  assert.equal(signPayload('manifest.', 1790935200, SECRET), 'v1=3c27d5c9bd3a6802b9e55f288367bc0c3eee66c50c1c969f7dd0c31462a5d656')
})

test('the WordPress document is served unchanged apart from Main analytics', () => {
  const html = '<!doctype html><html><head><title>x</title></head><body class="elementor"><main>Hi</main></body></html>'
  const off = prepareBridgedDocument(html, { enabled: false, gtmId: 'GTM-1', gaId: 'G-1', metaPixelId: '1' })
  assert.equal(off, html)
  const on = prepareBridgedDocument(html, { enabled: true, gtmId: 'GTM-ABC', gaId: 'G-XYZ', metaPixelId: '123' })
  assert.ok(on.indexOf('googletagmanager.com/gtm.js') < on.indexOf('</head>'))
  assert.ok(on.indexOf('ns.html?id=GTM-ABC') > on.indexOf('<body class="elementor">'))
  assert.ok(on.includes("fbq('init','123')"))
  assert.ok(on.endsWith('<main>Hi</main></body></html>'))
})

test('analytics ids are validated before being written into scripts', () => {
  const snippets = buildAnalyticsSnippets({ enabled: true, gtmId: "x');alert(1);//", gaId: 'G-OK1', metaPixelId: 'abc' })
  assert.ok(!snippets.head.includes('alert(1)'))
  assert.ok(snippets.head.includes('G-OK1'))
  assert.ok(!snippets.head.includes('fbq('))
  assert.equal(injectBeforeHeadClose('<p>no head</p>', '<s>'), '<s><p>no head</p>')
  assert.equal(injectAfterBodyOpen('<p>no body</p>', '<s>'), '<p>no body</p>')
})

test('internal rewrite token: derived from the secret, compared in constant time', async () => {
  const token = await deriveInternalToken(SECRET)
  assert.match(token, /^[a-f0-9]{64}$/)
  assert.equal(await deriveInternalToken(SECRET), token)
  assert.notEqual(await deriveInternalToken(`${SECRET}x`), token)
  assert.equal(await deriveInternalToken(''), '')
  assert.equal(constantTimeEqual('abc', 'abc'), true)
  assert.equal(constantTimeEqual('abc', 'abd'), false)
  assert.equal(constantTimeEqual('abc', 'abcd'), false)
  const request = (value) => new Request('http://x/wp-render', { headers: value ? { [INTERNAL_HEADER]: value } : {} })
  assert.equal(await isInternalRequest(request(token), SECRET), true)
  assert.equal(await isInternalRequest(request('nope'), SECRET), false)
  assert.equal(await isInternalRequest(request(''), SECRET), false)
  assert.equal(await isInternalRequest(request(token), ''), false)
})

test('form proxy forwards only known form endpoints', () => {
  assert.equal(isAllowedRestRoute('POST', 'acadvizen/v1/enquiry', {}), true)
  assert.equal(isAllowedRestRoute('GET', 'acadvizen/v1/enquiry', {}), false)
  assert.equal(isAllowedRestRoute('POST', 'contact-form-7/v1/contact-forms/5/feedback', {}), true)
  assert.equal(isAllowedRestRoute('POST', 'metform/v1/entries/insert/12', {}), true)
  assert.equal(isAllowedRestRoute('GET', 'wp/v2/users', {}), false)
  assert.equal(isAllowedRestRoute('GET', 'acadvizen-cms/v1/render', {}), false)
  assert.equal(isAllowedRestRoute('POST', 'contact-form-7/v1/contact-forms/5/../../wp/v2/users', {}), false)
  assert.equal(isAllowedAjaxAction('elementor_pro_forms_send_form', {}), true)
  assert.equal(isAllowedAjaxAction('heartbeat', {}), false)
  assert.equal(isAllowedAjaxAction(null, {}), false)
})

test('extra proxy routes/actions can be allowed by configuration only', () => {
  const env = { WORDPRESS_PROXY_EXTRA_REST_ROUTES: 'POST newplugin/v1/submit/*, DELETE bad/v1/x, GET ../etc', WORDPRESS_PROXY_EXTRA_AJAX_ACTIONS: 'my_form_send, bad action!' }
  assert.equal(parseExtraRestRoutes(env.WORDPRESS_PROXY_EXTRA_REST_ROUTES).length, 1)
  assert.equal(isAllowedRestRoute('POST', 'newplugin/v1/submit/42', env), true)
  assert.equal(isAllowedRestRoute('POST', 'newplugin/v1/submit/42/extra', env), false)
  assert.equal(isAllowedAjaxAction('my_form_send', env), true)
  assert.equal(isAllowedAjaxAction('bad action!', env), false)
})

test('proxy never forwards cookies or authorization', () => {
  const headers = buildForwardHeaders(new Headers({ cookie: 'wordpress_logged_in=1', authorization: 'Bearer x', 'content-type': 'application/json', 'x-wp-nonce': 'n' }), '203.0.113.9')
  assert.deepEqual(headers, { 'content-type': 'application/json', 'x-wp-nonce': 'n', 'x-forwarded-for': '203.0.113.9' })
})

test('the visitor IP is forwarded with a signature WordPress can verify (PHP fixture)', () => {
  const headers = buildForwardHeaders(new Headers({ cookie: 'x=1' }), '203.0.113.9', SECRET, 1790935200 * 1000)
  assert.equal(headers.cookie, undefined)
  assert.equal(headers['x-acadvizen-client-ip'], '203.0.113.9')
  assert.equal(headers['x-acadvizen-client-ts'], '1790935200')
  // Generated with sign_payload( 'client-ip.203.0.113.9', 1790935200, SECRET ) on PHP 8.3.
  assert.equal(headers['x-acadvizen-client-sig'], 'v1=00146838ae47f529d597c7343e7ebe176cc5e81f9c34ec8fd55b00066ee4792c')
  // Without a secret (or an unknown client) nothing extra is sent.
  assert.equal(buildForwardHeaders(new Headers(), '203.0.113.9')['x-acadvizen-client-sig'], undefined)
  assert.equal(buildForwardHeaders(new Headers(), 'unknown', SECRET)['x-acadvizen-client-ip'], undefined)
})

test('manifest from WordPress is validated', () => {
  const manifest = sanitizeManifest({
    pages: [{ path: '/ok', post_id: 4, version: 2, replace: 'yes', noindex: true }, { path: 'javascript:x' }, null, { path: '/a/../b' }],
    redirects: [{ from: '/old', to: '/ok' }, { from: '/x', to: '/x' }, { from: '/y', to: 'https://evil.example' }],
  })
  assert.deepEqual(manifest, {
    pages: [{ path: '/ok', postId: 4, version: 2, replace: false, noindex: true, updatedAt: null }],
    redirects: [{ from: '/old', to: '/ok' }],
  })
})
