// Live acceptance of Main Website redirects managed in Acadvizen Master Admin → Main Website → Redirects,
// checked on the real Main Website (its middleware answers the redirect).
//   WP_STORAGE_STATE=<session.json> WORDPRESS_CMS_WEBHOOK_SECRET=… node tools/verify-redirects-live.mjs
// Uses only an unused test address (/cms-acceptance-old-<time> → /courses). Refusals are checked against
// /about (a live page) and /admin, which are never changed. The test redirects are switched off and then
// deleted at the end (they were created by this test). Prints no credential.
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { signPayload } from '../lib/wordpress/signature.js'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = (process.env.WP_URL || 'https://enroll.acadvizen.com').replace(/\/$/, '')
const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const FROM = `/cms-acceptance-old-${T}`, CHAIN = `/cms-acceptance-chain-${T}`
const screen = (extra = '') => `${WP}/wp-admin/admin.php?page=acadvizen-cms-main&entity=redirects${extra}`
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const signed = async (body) => {
  const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'redirect-acceptance' }, ...body })
  const ts = Math.floor(Date.now() / 1000)
  const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, process.env.WORDPRESS_CMS_WEBHOOK_SECRET) }, body: raw })
  return r.json().catch(() => ({}))
}
const head = async (path) => { const r = await fetch(`${MAIN}${path}?acvcheck=${Date.now()}`, { redirect: 'manual' }); return { status: r.status, location: r.headers.get('location') || '' } }
const mine = async () => ((await signed({ op: 'list', entity: 'redirects', limit: 500 })).data || []).filter((r) => String(r.from_path || '').includes(T))

const browser = await chromium.launch()
const admin = await (await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })).newPage()
admin.on('dialog', (d) => d.accept())
const save = async () => { await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 180000 }), admin.locator('#acv-main-form input[type=submit]').dispatchEvent('click')]); return admin.evaluate(() => { const b = document.querySelector('.acv-cms-flash'); return b ? { kind: (b.className.match(/notice-(success|warning|error)/) || [])[1] || 'none', text: (b.textContent || '').replace(/\s+/g, ' ').trim() } : { kind: 'none', text: '' } }) }
const form = async (from, to) => { await admin.goto(screen('&view=edit'), { timeout: 180000 }); await admin.fill('[name="acv_field[from_path]"]', from); await admin.fill('[name="acv_field[to_path]"]', to); await admin.selectOption('[name="acv_field[status_code]"]', '301') }

try {
  const aboutBefore = await head('/about')
  await form(`${FROM}/`, '/courses')
  await save()
  const id = new URL(admin.url()).searchParams.get('id')
  const stored = (await mine()).find((r) => r.id === id)
  check('R1 saved from WordPress, stored without the trailing slash, switched off', Boolean(id) && stored?.from_path === FROM && stored?.is_active === false, JSON.stringify(stored ? { from: stored.from_path, active: stored.is_active } : null))
  check('R1 a switched-off redirect does nothing on Main', (await head(FROM)).status === 404)
  await admin.locator('input[name="acv_active"]').setChecked(true, { force: true }); await save()
  const on = await head(FROM)
  check('R2 switched on: Main answers 301 to /courses (one hop)', on.status === 301 && /\/courses(\?|$)/.test(on.location), `${on.status} ${on.location}`)
  await form('/about', '/courses'); const r3 = await save()
  check('R3 redirecting a live page is refused with a clear message', r3.kind === 'error' && /published page or blog lives at this address/.test(r3.text), r3.text.slice(0, 110))
  const aboutAfter = await head('/about')
  check('R3 /about still answers as before', aboutAfter.status === aboutBefore.status && aboutAfter.status === 200, String(aboutAfter.status))
  await form('/admin', '/courses'); const r4 = await save()
  check('R4 the admin address cannot be redirected', /belongs to the website itself/.test(r4.text), r4.text.slice(0, 110))
  await form(CHAIN, FROM); const r5 = await save()
  check('R4 a redirect to an already-redirected address is refused (no chains or loops)', /chain of redirects/.test(r5.text), r5.text.slice(0, 110))
  const del = await signed({ op: 'delete', entity: 'redirects', id, confirm: true })
  check('R5 a switched-on redirect cannot be deleted', del.error === 'still_active', del.error || 'deleted')
  await admin.goto(screen(`&view=edit&id=${id}`), { timeout: 180000 }); await admin.locator('input[name="acv_active"]').setChecked(false, { force: true }); await save()
  check('R5 switched off: the old address no longer redirects', (await head(FROM)).status === 404)
} catch (e) {
  check('run finished without an error', false, String(e.message || e).slice(0, 200))
} finally {
  for (const r of await mine()) { if (r.is_active) await signed({ op: 'set_status', entity: 'redirects', id: r.id, active: false }); await signed({ op: 'delete', entity: 'redirects', id: r.id, confirm: true }) }
  const left = await mine()
  check('Z cleanup: the test redirects are gone and the test address answers 404', left.length === 0 && (await head(FROM)).status === 404 && (await head(CHAIN)).status === 404, `${left.length} left`)
  console.log(`\n${results.filter(Boolean).length} passed, ${results.filter((x) => !x).length} failed [LIVE]`)
  await browser.close()
  process.exitCode = results.every(Boolean) ? 0 : 1
}
