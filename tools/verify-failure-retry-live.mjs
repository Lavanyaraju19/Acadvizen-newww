// Live acceptance of failure reporting and retry for "Both" (no secret, no test code on the server). One labelled,
// noindex test page published to Main and Enrollment; then a temporary Rank Math redirect on ITS OWN Enrollment
// address (the editor's "Redirect this page", 307) makes the Enrollment website unable to show the next approved
// revision, while Main shows it -> Approvals must report a PARTIAL FAILURE naming Enrollment (never success) ->
// the redirect is removed -> "Check again" -> verified on both. The page is then unpublished and KEPT as a draft;
// the redirect is removed in every case. Prints no credential or cookie.
//
//   WP_STORAGE_STATE=<session.json> node tools/verify-failure-retry-live.mjs
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = (process.env.WP_URL || 'https://enroll.acadvizen.com').replace(/\/$/, '')
const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const LIVE = /acadvizen\.com/.test(WP + MAIN)
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const LABEL = `CMS FAILURE TEST ${T}`, SLUG = `cms-failure-test-${T}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${new Date().toISOString().slice(11, 19)}Z ${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const info = (m) => console.log(`${new Date().toISOString().slice(11, 19)}Z INFO ${m}`)
const get = async (url) => { const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}acvcheck=${Date.now()}`, { redirect: 'manual' }); return { status: r.status, html: r.status === 200 ? await r.text() : '', location: r.headers.get('location') || '' } }
const until = async (fn, pred, ms) => { const t0 = Date.now(); let last; while (Date.now() - t0 < ms) { last = await fn(); if (pred(last)) return { ok: true, s: Math.round((Date.now() - t0) / 1000), last }; await sleep(15000) } return { ok: false, s: Math.round((Date.now() - t0) / 1000), last } }

const browser = await chromium.launch({ args: ['--disable-gpu'] })
const ctx = await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept())
await page.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)
const nonce = (await page.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in to wp-admin'); process.exit(2) }
const rest = async (method, route, data) => { const r = await ctx.request.fetch(`${WP}/wp-json/${route}`, { method, headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: data ? JSON.stringify(data) : undefined }); return { status: r.status(), json: await r.json().catch(() => ({})) } }
async function editor(id) {
  await page.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 180000 })
  await page.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 300000 })
  await sleep(1500)
  return Number(new URL(page.url()).searchParams.get('post'))
}
const publish = async () => { await page.evaluate(async () => { await $e.run('document/save/publish') }); await page.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(3000) }
// The publication row on Approvals -> Recent publications (result and per-website text).
async function approvals() { for (let i = 0; i < 2; i++) { try { await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`, { timeout: 300000 }); return } catch (e) { if (i) throw e } } }
async function publication() {
  await approvals()
  const row = page.locator('tr', { hasText: LABEL }).filter({ has: page.locator('a.acv-verify, a.acv-rollback') }).first()
  return (await row.count()) ? (await row.innerText()).replace(/\s+/g, ' ').trim() : ''
}

let id = 0, redirectionId = ''
try {
  console.log(`${LIVE ? 'LIVE' : 'LOCAL'} | ${WP} | ${MAIN} | "${LABEL}"`)
  const created = await rest('POST', 'wp/v2/pages', { title: LABEL, slug: SLUG, status: 'draft', template: 'elementor_header_footer' })
  id = created.json.id
  const robots = await rest('POST', 'rankmath/v1/updateMeta', { objectType: 'post', objectID: id, meta: { rank_math_robots: ['noindex', 'nofollow'] } })
  check('1 noindex test page created (Both)', created.status === 201 && id && robots.status === 200, `#${id}`)
  await editor(id)
  await page.evaluate((v) => {
    $e.run('document/elements/settings', { container: elementor.documents.getCurrent().container, settings: { acv_publish_target: 'both' } })
    const box = $e.run('document/elements/create', { container: elementor.getPreviewContainer(), model: { elType: 'container', settings: { background_background: 'classic', background_color: '#0B1F3A', padding: { unit: 'px', top: '60', right: '24', bottom: '60', left: '24', isLinked: false } } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'heading', settings: { title: v, header_size: 'h1', title_color: '#FFFFFF' } } })
  }, `${LABEL} V1`)
  await publish()
  const v1 = await until(async () => ({ m: await get(`${MAIN}/${SLUG}`), e: await get(`${WP}/${SLUG}/`), p: await publication() }), (x) => x.m.html.includes(`${LABEL} V1`) && x.e.html.includes(`${LABEL} V1`) && /verified/.test(x.p) && !/Publishing/.test(x.p), 30 * 60000)
  check('2 V1 published and verified on both websites', v1.ok, `${v1.s}s | ${v1.last?.p?.slice(0, 160)}`)

  // The cause: a temporary redirect on this page's own Enrollment address (Rank Math, as the editor sidebar sets it).
  const red = await rest('POST', 'rankmath/v1/updateRedirection', { objectID: id, objectType: 'post', hasRedirect: true, redirectionUrl: `${WP}/`, redirectionSources: `${SLUG}`, redirectionType: 307 })
  redirectionId = String(red.json?.data?.id || red.json?.id || red.json?.redirectionID || '')
  const redirected = await get(`${WP}/${SLUG}/`)
  info(`redirect saved: HTTP ${red.status} ${JSON.stringify(red.json).slice(0, 200)}`)
  check('3 cause in place: the Enrollment address of the test page now redirects (307)', [301, 302, 307].includes(redirected.status), `HTTP ${redirected.status} -> ${redirected.location}`)

  const copy = await editor(id)
  await page.evaluate((v) => { const f = (c) => (c.model.get('widgetType') === 'heading' ? c : (c.children || []).map(f).find(Boolean)); $e.run('document/elements/settings', { container: f(elementor.getPreviewContainer()), settings: { title: v } }) }, `${LABEL} V2`)
  await publish()
  info(`V2 published from working copy #${copy}`)
  const failed = await until(publication, (p) => /partial[ _]failure|failed/i.test(p) && !/Publishing/.test(p), 40 * 60000)
  // The redirect also stops WordPress drawing the page for Main, so the result is a failure on both websites (or a
  // partial failure): never success, each website with its reason, and Main keeps the previous approved version.
  const mainKept = await get(`${MAIN}/${SLUG}`)
  check('4 reported as a failure with each website\'s reason, never as success', failed.ok && /Enrollment website: Failed/i.test(failed.last) && /Main website: (Failed|Published)/i.test(failed.last), `${failed.s}s | ${failed.last.slice(0, 300)}`)
  check('4 visitors on Main keep the previous approved version (V1), not a broken page', mainKept.status === 200 && mainKept.html.includes(`${LABEL} V1`) && !mainKept.html.includes(`${LABEL} V2`), `HTTP ${mainKept.status}`)

  // The cause removed, then "Check again" on Approvals -> Recent publications.
  const rem = await rest('POST', 'rankmath/v1/updateRedirection', { objectID: id, objectType: 'post', hasRedirect: false, redirectionID: redirectionId, redirectionSources: `${SLUG}` })
  const back = await until(() => get(`${WP}/${SLUG}/`), (r) => r.status === 200, 120000)
  info(`redirect removal: HTTP ${rem.status} ${JSON.stringify(rem.json).slice(0, 160)}`)
  check('5 cause removed: the Enrollment address answers 200 again', back.ok, `HTTP ${back.last?.status}`)
  await approvals()
  const again = page.locator(`a.acv-verify[href*="post=${id}&"]`).first()
  const hasAgain = (await again.count()) > 0
  if (hasAgain) await Promise.all([page.waitForNavigation({ timeout: 300000 }), again.dispatchEvent('click')])
  const ok = await until(async () => ({ p: await publication(), e: await get(`${WP}/${SLUG}/`), m: await get(`${MAIN}/${SLUG}`) }), (x) => /verified/.test(x.p) && !/Failed|Publishing/i.test(x.p) && x.e.html.includes(`${LABEL} V2`) && x.m.html.includes(`${LABEL} V2`), 30 * 60000)
  check('6 "Check again" retries the failed websites: verified on both, both show V2', hasAgain && ok.ok, `${ok.s}s | ${ok.last?.p?.slice(0, 220)}`)
} catch (e) {
  check('run finished without an error', false, String(e.message || e).slice(0, 300))
} finally {
  if (id) {
    // The redirect is removed whatever happened, then the page is unpublished (kept as a draft).
    await rest('POST', 'rankmath/v1/updateRedirection', { objectID: id, objectType: 'post', hasRedirect: false, redirectionID: redirectionId, redirectionSources: `${SLUG}` }).catch(() => {})
    await page.goto(`${WP}/wp-admin/edit.php?post_type=page&post_status=all&s=${encodeURIComponent(LABEL)}`, { timeout: 180000 })
    const row = `#post-${id}`
    if (await page.locator(row).count()) {
      await page.locator(`${row} button.editinline`).dispatchEvent('click')
      await page.locator(`#edit-${id} select[name="_status"]`).selectOption('draft')
      await page.locator(`#edit-${id} button.save`).dispatchEvent('click')
      await page.waitForSelector(`${row}:not(.inline-editor)`, { timeout: 120000 }).catch(() => {}); await sleep(3000)
    }
    const st = (await rest('GET', `wp/v2/pages/${id}?context=edit`)).json.status
    const gone = await until(async () => ({ m: await get(`${MAIN}/${SLUG}`), e: await get(`${WP}/${SLUG}/`) }), (x) => (x.m.status !== 200 || !x.m.html.includes(LABEL)) && x.e.status === 404, 300000)
    check('7 cleanup: unpublished (kept as a draft), gone from both websites, no redirect left', st === 'draft' && gone.ok, `status ${st} | Main ${gone.last?.m?.status}, Enrollment ${gone.last?.e?.status}`)
  }
  await browser.close()
}
const failedCount = results.filter((x) => !x).length
console.log(`\n${results.length - failedCount} passed, ${failedCount} failed [${LIVE ? 'LIVE' : 'LOCAL'}]${id ? ` | test page #${id} kept as a draft` : ''}`)
process.exit(failedCount ? 1 : 0)
