import test from 'node:test'
import assert from 'node:assert/strict'

// The WordPress editor shows Main's signed preview (/preview/wordpress/...) inside desktop / tablet /
// mobile frames. Main allows exactly that route to be framed by the WordPress origin taken from
// WORDPRESS_CMS_API_URL; WordPress reading / Render Bridge needs its own switch (WORDPRESS_CONTENT_ENABLED).
const KEYS = ['WORDPRESS_CMS_API_URL', 'WORDPRESS_CONTENT_ENABLED']
let n = 0

async function loadConfig(env) {
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))
  for (const k of KEYS) delete process.env[k]
  Object.assign(process.env, env)
  try {
    const { default: config } = await import(`../../next.config.mjs?case=${++n}`)
    const headers = await config.headers()
    const csp = (source) => headers.filter((h) => h.source === source).flatMap((h) => h.headers).filter((h) => h.key === 'Content-Security-Policy').pop().value
    return { preview: csp('/preview/wordpress/:path*'), site: csp('/(.*)') }
  } finally {
    for (const k of KEYS) (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]))
  }
}
const ancestors = (csp) => csp.match(/frame-ancestors ([^;]+)/)[1]

test('with WORDPRESS_CMS_API_URL set, only the preview route may be framed, and only by WordPress', async () => {
  const { preview, site } = await loadConfig({ WORDPRESS_CMS_API_URL: 'https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1' })
  assert.equal(ancestors(preview), "'self' https://enroll.acadvizen.com")
  assert.equal(ancestors(site), "'none'")
  // The URL alone does not switch on the Render Bridge: no WordPress scripts or frames are allowed.
  assert.doesNotMatch(site.match(/script-src [^;]+/)[0], /enroll\.acadvizen\.com/)
  assert.doesNotMatch(site.match(/frame-src [^;]+/)[0], /enroll\.acadvizen\.com/)
})

test('without WORDPRESS_CMS_API_URL nothing may be framed (previews in WordPress are refused)', async () => {
  const { preview, site } = await loadConfig({})
  assert.equal(ancestors(preview), "'none'")
  assert.equal(ancestors(site), "'none'")
})

test('an invalid WORDPRESS_CMS_API_URL fails closed', async () => {
  const { preview } = await loadConfig({ WORDPRESS_CMS_API_URL: 'not a url' })
  assert.equal(ancestors(preview), "'none'")
})
