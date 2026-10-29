// Live acceptance of the approval workflow (Acadvizen CMS Switches → Approval on) through the real
// WordPress admin, Elementor editor and Master Admin → Approvals screen, with an administrator (reviewer).
// One clearly labelled test page ("CMS APPROVAL TEST <time>", Publish To: Both):
//   draft (not public) → Publish = submitted, still not public → Approve → Publish approved revision →
//   verified live on Main and Enrollment → a change through the working copy stays private until approved
//   → Reject keeps the live version → resubmit, approve, publish → change live → Restore the earlier
//   revision → Unpublish. The page is KEPT as an unpublished draft (never deleted automatically).
//
//   WP_STORAGE_STATE=<session.json> node tools/verify-approval-live.mjs
// Addresses: WP_URL, MAIN_URL (default: the live sites). Screenshots: EVIDENCE_DIR. Prints no credential.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = (process.env.WP_URL || 'https://enroll.acadvizen.com').replace(/\/$/, '')
const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const LIVE = /acadvizen\.com/.test(WP + MAIN)
const OUT = process.env.EVIDENCE_DIR || path.join(process.cwd(), 'approval-live-evidence'); fs.mkdirSync(OUT, { recursive: true })
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const MARK = `CMS APPROVAL TEST ${T}`, SLUG = `cms-approval-test-${T}`
const TRACKING = /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|facebook\.(com|net)|clarity\.ms|hotjar\.(com|io))$/i
// Playwright request errors carry a call log with the cookies: only ever print the first line of an error.
process.on('uncaughtException', (e) => { console.log(`STOP: ${String(e?.message || e).split('\n')[0].slice(0, 200)}`); process.exit(1) })
process.on('unhandledRejection', (e) => { console.log(`STOP: ${String(e?.message || e).split('\n')[0].slice(0, 200)}`); process.exit(1) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const get = async (url) => { const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}acvcheck=${Date.now()}`, { redirect: 'manual' }); return { status: r.status, html: r.status === 200 ? await r.text() : '' } }
const until = async (fn, pred, ms = 300000) => { const t0 = Date.now(); let last; while (Date.now() - t0 < ms) { last = await fn(); if (pred(last)) return { ok: true, s: Math.round((Date.now() - t0) / 1000), last }; await sleep(6000) } last = await fn(); return { ok: pred(last), s: Math.round((Date.now() - t0) / 1000), last } }
const both = async () => ({ main: await get(`${MAIN}/${SLUG}`), enroll: await get(`${WP}/${SLUG}/`) })

const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-features=CalculateNativeWinOcclusion'] })
const ctx = await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })
await ctx.route((u) => TRACKING.test(u.hostname), (r) => r.abort())
const page = await ctx.newPage(); page.on('dialog', (d) => d.accept())
await page.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)
const nonce = (await page.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in to wp-admin'); process.exit(2) }
const rest = async (method, route, data) => { const r = await ctx.request.fetch(`${WP}/wp-json/${route}`, { method, headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: data ? JSON.stringify(data) : undefined }); return { status: r.status(), json: await r.json().catch(() => ({})) } }

async function openElementor(id) {
  await page.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 180000 })
  await page.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 180000 })
  await sleep(1500)
  return Number(new URL(page.url()).searchParams.get('post'))
}
async function save(kind) { await page.evaluate(async (k) => { await $e.run(k === 'publish' ? 'document/save/publish' : 'document/save/draft') }, kind); await page.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(2500) }
async function setHeading(text) { await page.evaluate((t) => { const f = (c) => (c.model.get('widgetType') === 'heading' ? c : (c.children || []).map(f).find(Boolean)); $e.run('document/elements/settings', { container: f(elementor.getPreviewContainer()), settings: { title: t } }) }, text) }
// Plugin 0.7.9+ (DIRECT_PUBLISH=1): an administrator's Publish publishes directly, so this test asks for review
// the way an administrator does then: Save Draft, then status "Pending Review" (block editor / REST).
const DIRECT = process.env.DIRECT_PUBLISH === '1'
async function submitForReview(id) {
  if (!DIRECT) return save('publish')
  await save('draft')
  const r = await rest('POST', `wp/v2/pages/${id}`, { status: 'pending' })
  if (r.status !== 200) console.log(`INFO submit for review #${id}: HTTP ${r.status} ${r.json.code || ''}`)
}
async function row(id) {
  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`, { timeout: 180000 })
  const r = page.locator(`#acv-candidate-${id}`)
  return (await r.count()) ? { state: await r.getAttribute('data-state'), approve: await r.locator('.acv-approve').count(), publish: await r.locator('.acv-publish').count() } : null
}
async function act(id, selector, { tick = false, note = '' } = {}) {
  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`, { timeout: 180000 })
  if (tick) for (const box of await page.locator(`#acv-candidate-${id} .acv-preview-check`).all()) await box.check()
  if (note) await page.locator(`#acv-candidate-${id} textarea[name="note"]`).fill(note)
  await Promise.all([page.waitForNavigation({ timeout: 300000 }), page.locator(`#acv-candidate-${id} ${selector}`).first().dispatchEvent('click')])
  // The plugin's own message (not WordPress' or other plugins' notices shown above it).
  const own = page.locator('.acv-cms-approval-flash')
  const box = (await own.count()) ? own.first() : page.locator('.notice').filter({ hasText: /approv|reject|publish|restor/i }).first()
  return (await box.innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 200)
}

let liveId = 0
try {
  console.log(`${LIVE ? 'LIVE' : 'LOCAL'} | WordPress ${WP} | Main ${MAIN} | test page "${MARK}"`)
  const settings = await (async () => { await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-settings`); return ((await page.locator('#wpbody-content').innerText()).match(/Optional features\s+([^\n]+)/) || [])[1] || '' })()
  check('0 Approval and Render Bridge are on', /APPROVAL on/.test(settings) && /RENDER_BRIDGE on/.test(settings), settings)
  const media = (await rest('GET', 'wp/v2/media?media_type=image&per_page=1')).json[0]
  const created = await rest('POST', 'wp/v2/pages', { title: MARK, slug: SLUG, status: 'draft', template: 'elementor_header_footer' })
  liveId = created.json.id
  check('1 test page created as a draft', created.status === 201 && liveId, `#${liveId}`)
  // Never indexed (Rank Math's own endpoint), so Instant Indexing skips it while it is briefly public.
  const robots = await rest('POST', 'rankmath/v1/updateMeta', { objectType: 'post', objectID: liveId, meta: { rank_math_robots: ['noindex', 'nofollow'] } })
  check('1 test page set to noindex before publishing', robots.status === 200, `HTTP ${robots.status}`)
  await openElementor(liveId)
  await page.evaluate(({ v, img }) => {
    $e.run('document/elements/settings', { container: elementor.documents.getCurrent().container, settings: { acv_publish_target: 'both' } })
    const box = $e.run('document/elements/create', { container: elementor.getPreviewContainer(), model: { elType: 'container', settings: { background_background: 'classic', background_color: '#0B1F3A', padding: { unit: 'px', top: '60', right: '24', bottom: '60', left: '24', isLinked: false } } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'heading', settings: { title: v, header_size: 'h1', title_color: '#FFFFFF' } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'button', settings: { text: 'Enquire now', link: { url: '/contact', is_external: '', nofollow: '' } } } })
    if (img) $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'image', settings: { image: { id: img.id, url: img.url } } } })
  }, { v: `${MARK} V1`, img: media ? { id: media.id, url: media.source_url } : null })
  await save('draft')
  let pub = await both()
  check('2 draft: not public on Main or Enrollment', pub.main.status !== 200 && pub.enroll.status !== 200, `Main ${pub.main.status}, Enrollment ${pub.enroll.status}`)

  await submitForReview(liveId)
  let r = await row(liveId)
  check('3 "Publish" submits it for approval (waiting, not live)', r?.state === 'pending' && r.approve === 1, JSON.stringify(r))
  pub = await both()
  check('3 still not public while waiting', pub.main.status !== 200 && pub.enroll.status !== 200)

  const approved = await act(liveId, '.acv-approve', { tick: true })
  r = await row(liveId)
  check('4 a reviewer approves exactly that revision', r?.state === 'approved' && r.publish === 1, `${r?.state} | ${approved}`)
  const published = await act(liveId, '.acv-publish')
  const v1 = await until(both, (b) => b.main.html.includes(`${MARK} V1`) && b.enroll.html.includes(`${MARK} V1`))
  check('5 "Publish approved revision": live on Main and Enrollment', v1.ok, `${v1.s}s | ${published}`)
  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`); await page.screenshot({ path: path.join(OUT, 'approvals-after-publish.png'), fullPage: true }).catch(() => {})

  const restEdit = await rest('POST', `wp/v2/pages/${liveId}`, { title: `${MARK} edited directly` })
  check('6 the live page cannot be changed directly (needs approval)', restEdit.status === 403 && restEdit.json.code === 'acv_live_needs_approval', `HTTP ${restEdit.status} ${restEdit.json.code || ''}`)
  const copyId = await openElementor(liveId)
  check('6 opening the live page in Elementor opens its working copy', copyId && copyId !== liveId, `${liveId} -> ${copyId}`)
  await setHeading(`${MARK} V2`); await submitForReview(copyId)
  r = await row(copyId)
  pub = await both()
  check('6 the change is waiting for approval; both websites still show V1', r?.state === 'pending' && pub.main.html.includes(`${MARK} V1`) && pub.enroll.html.includes(`${MARK} V1`) && !pub.main.html.includes(`${MARK} V2`), r?.state)

  const rejected = await act(copyId, '.acv-reject', { note: 'Acceptance test: reject once.' })
  r = await row(copyId)
  pub = await both()
  // A rejected change goes back to the editor as a draft and leaves the approval queue.
  check('7 Reject: the change goes back to the editor; both websites keep V1', /Rejected/i.test(rejected) && (!r || ['rejected', 'draft'].includes(r.state)) && pub.main.html.includes(`${MARK} V1`) && pub.enroll.html.includes(`${MARK} V1`) && !pub.main.html.includes(`${MARK} V2`), `${r?.state || 'not in the queue'} | ${rejected}`)

  const again = await openElementor(liveId); await submitForReview(again)
  r = await row(copyId)
  check('8 resubmitted after the rejection', r?.state === 'pending', r?.state)
  await act(copyId, '.acv-approve', { tick: true }); await act(copyId, '.acv-publish')
  const v2 = await until(both, (b) => b.main.html.includes(`${MARK} V2`) && b.enroll.html.includes(`${MARK} V2`) && !b.main.html.includes(`${MARK} V1`))
  check('8 approved change live on Main and Enrollment', v2.ok, `${v2.s}s`)

  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`, { timeout: 180000 })
  const restore = page.locator(`a.acv-rollback[href*="post=${liveId}&"]`).first()
  if (await restore.count()) await Promise.all([page.waitForNavigation({ timeout: 300000 }), restore.dispatchEvent('click')])
  const back = await until(both, (b) => b.main.html.includes(`${MARK} V1`) && b.enroll.html.includes(`${MARK} V1`) && !b.main.html.includes(`${MARK} V2`))
  check('9 Restore: the earlier revision is back live on both websites', back.ok, `${back.s}s`)
} catch (e) {
  check('run finished without an error', false, String(e.message || e).split('\n')[0].slice(0, 200))
} finally {
  if (liveId) {
    // With approval on, a reviewer takes a live page off line in Pages → Quick Edit → Status: Draft.
    let status = ''
    try {
      await page.goto(`${WP}/wp-admin/edit.php?post_type=page&post_status=all&s=${encodeURIComponent(MARK)}`, { timeout: 180000 })
      const rowSel = `#post-${liveId}`
      await page.locator(rowSel).waitFor({ state: "attached", timeout: 60000 })
      await page.locator(`${rowSel} button.editinline`).dispatchEvent('click')
      await page.locator('#the-list tr.inline-editor select[name="_status"]').selectOption('draft')
      await page.locator('#the-list tr.inline-editor button.save').dispatchEvent('click')
      await page.waitForSelector(`${rowSel}:not(.inline-editor)`, { timeout: 120000 }); await sleep(2000)
      status = (await rest('GET', `wp/v2/pages/${liveId}?context=edit`)).json.status || ''
    } catch (e) { status = `error: ${String(e.message).split('\n')[0].slice(0, 80)}` }
    const gone = await until(both, (b) => (b.main.status !== 200 || !b.main.html.includes(MARK)) && (b.enroll.status !== 200 || !b.enroll.html.includes(MARK)), 180000)
    check('10 Unpublish (Pages → Quick Edit → Draft, kept as a draft): gone from both websites', status === 'draft' && gone.ok, `status ${status} | Main ${gone.last.main.status}, Enrollment ${gone.last.enroll.status}`)
  }
  console.log(`\n${results.filter(Boolean).length} passed, ${results.filter((x) => !x).length} failed [${LIVE ? 'LIVE' : 'LOCAL'}] | test page #${liveId} kept as a draft`)
  await browser.close()
  process.exitCode = results.every(Boolean) ? 0 : 1
}
