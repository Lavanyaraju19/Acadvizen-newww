// Live acceptance of scheduled publishing as an administrator does it (plugin 0.7.9+): a labelled, noindex test
// page with a publish date a few minutes ahead, designed in Elementor, "Publish" -> scheduled (not public) -> the
// page appears on the Main Website at its time -> Unpublish (Pages -> Quick Edit -> Draft). The page is KEPT as an
// unpublished draft (never deleted automatically).
//
//   WP_STORAGE_STATE=<session.json> node tools/verify-scheduling-live.mjs
// Addresses: WP_URL, MAIN_URL (default: the live sites). SCHEDULE_MIN (default 4). Prints no credential or cookie.
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = (process.env.WP_URL || 'https://enroll.acadvizen.com').replace(/\/$/, '')
const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const LIVE = /acadvizen\.com/.test(WP + MAIN)
const MIN = Number(process.env.SCHEDULE_MIN || 4)
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const LABEL = `CMS SCHEDULE TEST ${T}`, SLUG = `cms-schedule-test-${T}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const get = async (url) => { const r = await fetch(`${url}?acvcheck=${Date.now()}`, { redirect: 'manual' }); return { status: r.status, html: r.status === 200 ? await r.text() : '' } }

const browser = await chromium.launch({ args: ['--disable-gpu'] })
const ctx = await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept())
await page.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)
const nonce = (await page.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in to wp-admin'); process.exit(2) }
const rest = async (method, route, data) => { const r = await ctx.request.fetch(`${WP}/wp-json/${route}`, { method, headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: data ? JSON.stringify(data) : undefined }); return { status: r.status(), json: await r.json().catch(() => ({})) } }
async function rowState(id) {
  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`, { timeout: 180000 })
  const r = page.locator(`#acv-candidate-${id}`)
  return (await r.count()) ? await r.getAttribute('data-state') : ''
}

let id = 0
try {
  console.log(`${LIVE ? 'LIVE' : 'LOCAL'} | ${WP} | ${MAIN} | "${LABEL}"`)
  const due = new Date(Date.now() + MIN * 60000)
  const created = await rest('POST', 'wp/v2/pages', { title: LABEL, slug: SLUG, status: 'draft', template: 'elementor_header_footer', date_gmt: due.toISOString().slice(0, 19) })
  id = created.json.id
  check('1 test page created as a draft, dated ' + MIN + ' min ahead', created.status === 201 && id, `#${id}, due ${due.toISOString().slice(11, 19)}Z`)
  const robots = await rest('POST', 'rankmath/v1/updateMeta', { objectType: 'post', objectID: id, meta: { rank_math_robots: ['noindex', 'nofollow'] } })
  check('1 test page set to noindex', robots.status === 200, `HTTP ${robots.status}`)
  await page.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 180000 })
  await page.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: Number(process.env.EDITOR_TIMEOUT_MS || 300000) })
  await page.evaluate((label) => {
    $e.run('document/elements/settings', { container: elementor.documents.getCurrent().container, settings: { acv_publish_target: 'main' } })
    const box = $e.run('document/elements/create', { container: elementor.getPreviewContainer(), model: { elType: 'container', settings: { background_background: 'classic', background_color: '#0B1F3A', padding: { unit: 'px', top: '60', right: '24', bottom: '60', left: '24', isLinked: false } } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'heading', settings: { title: label, header_size: 'h1', title_color: '#FFFFFF' } } })
  }, LABEL)
  await page.evaluate(async () => { await $e.run('document/save/publish') }); await page.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(3000)
  const state = await rowState(id)
  const before = await get(`${MAIN}/${SLUG}`)
  check('2 Publish with a future date schedules it (Approvals: scheduled); not public before its time', state === 'scheduled' && !before.html.includes(LABEL), `state ${state || 'none'}, Main HTTP ${before.status}`)
  let appeared = null
  const deadline = due.getTime() + 8 * 60000
  while (Date.now() < deadline) { const r = await get(`${MAIN}/${SLUG}`); if (r.html.includes(LABEL)) { appeared = new Date(); break } await sleep(15000) }
  check('3 published on the Main Website at its time', Boolean(appeared), appeared ? `${Math.round((appeared - due) / 1000)} s after the set time` : 'not live within 8 min of its time')
  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`, { timeout: 180000 })
  const rec = (await page.locator('#wpbody-content').innerText()).includes(LABEL)
  check('4 listed on Approvals (Recent publications)', rec)
} catch (e) {
  check('run finished without an error', false, String(e.message || e).slice(0, 300))
} finally {
  if (id) {
    await page.goto(`${WP}/wp-admin/edit.php?post_type=page&post_status=all&s=${encodeURIComponent(LABEL)}`, { timeout: 180000 })
    const row = `#post-${id}`
    if (await page.locator(row).count()) {
      await page.locator(`${row} button.editinline`).dispatchEvent('click')
      await page.locator(`#edit-${id} select[name="_status"]`).selectOption('draft')
      await page.locator(`#edit-${id} button.save`).dispatchEvent('click')
      await page.waitForSelector(`${row}:not(.inline-editor)`, { timeout: 120000 }).catch(() => {}); await sleep(3000)
    }
    const st = (await rest('GET', `wp/v2/pages/${id}?context=edit`)).json.status
    let gone = false
    for (let i = 0; i < 24 && !gone; i++) { const r = await get(`${MAIN}/${SLUG}`); gone = r.status !== 200 || !r.html.includes(LABEL); if (!gone) await sleep(10000) }
    check('5 Unpublish (Quick Edit -> Draft, kept as a draft): gone from Main', st === 'draft' && gone, `status ${st}`)
  }
  await browser.close()
}
const failed = results.filter((x) => !x).length
console.log(`\n${results.length - failed} passed, ${failed} failed [${LIVE ? 'LIVE' : 'LOCAL'}]${id ? ` | test page #${id} kept as a draft` : ''}`)
process.exit(failed ? 1 : 0)
