// Live check of the Main homepage registration popup, managed in Acadvizen Master Admin → Main Website →
// Sections ("registration_popup"): the popup opens after its 90-second delay with the saved title; a title
// change saved in the admin appears in the live popup; the original title is restored at the end (also on
// error). Analytics requests are blocked. Prints no credential.
//   WP_STORAGE_STATE=<session.json> WORDPRESS_CMS_WEBHOOK_SECRET=… node tools/verify-popup-live.mjs
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { signPayload } from '../lib/wordpress/signature.js'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = 'https://enroll.acadvizen.com', MAIN = 'https://www.acadvizen.com'
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const TRACKING = /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|facebook\.(com|net)|clarity\.ms|hotjar\.(com|io))$/i
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const api = async (body) => { const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'popup-acceptance' }, ...body }); const ts = Math.floor(Date.now() / 1000); const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, process.env.WORDPRESS_CMS_WEBHOOK_SECRET) }, body: raw }); return r.json().catch(() => ({})) }
const browser = await chromium.launch()
async function popupText() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.route((u) => TRACKING.test(u.hostname), (r) => r.abort())
  const p = await ctx.newPage()
  await p.goto(`${MAIN}/?popupcheck=${Date.now()}`, { waitUntil: 'load', timeout: 120000 })
  const before = (await p.locator('body').innerText()).length
  await p.waitForTimeout(95000) // the popup opens after 90 s
  const dialog = p.locator('[role="dialog"], .fixed.inset-0').last()
  const text = (await dialog.innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
  await ctx.close()
  return { text, grew: before }
}

const list = await api({ op: 'list', entity: 'home_sections', limit: 50 })
const row = (list.data || []).find((r) => r.section_key === 'registration_popup')
const original = row ? (await api({ op: 'get', entity: 'home_sections', id: row.id })).data : null
check('0 the registration popup section exists and is active', Boolean(original) && original.is_active !== false, original ? `title "${original.title}"` : 'not found')
let changed = false
try {
  const first = await popupText()
  check('1 the live popup opens after 90 s with the saved title', first.text.includes(original.title), first.text.slice(0, 120))
  const admin = await (await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })).newPage()
  await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-main&entity=home_sections&view=edit&id=${row.id}`, { timeout: 180000 })
  await admin.fill('[name="acv_field[title]"]', `${original.title} (CMS TEST ${T})`)
  await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 180000 }), admin.locator('#acv-main-form input[type=submit]').dispatchEvent('click')])
  changed = true
  const saved = (await admin.locator('.acv-cms-flash').first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
  check('2 title change saved in the admin', /Saved/.test(saved), saved.slice(0, 100))
  let second = { text: '' }
  for (let i = 0; i < 3 && !second.text.includes(`CMS TEST ${T}`); i++) second = await popupText()
  check('3 the live popup shows the new title', second.text.includes(`CMS TEST ${T}`), second.text.slice(0, 120))
} catch (e) {
  check('run finished without an error', false, String(e.message || e).slice(0, 200))
} finally {
  if (changed || original) {
    const back = await api({ op: 'save', entity: 'home_sections', id: original.id, record: { title: original.title } })
    const now = (await api({ op: 'get', entity: 'home_sections', id: original.id })).data
    check('Z original title restored', back.ok && now?.title === original.title, now?.title)
  }
  console.log(`\n${results.filter(Boolean).length} passed, ${results.filter((x) => !x).length} failed [LIVE]`)
  await browser.close()
  process.exitCode = results.every(Boolean) ? 0 : 1
}
