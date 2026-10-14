// LOCAL acceptance test: approval before publishing, with the real Elementor editor, for the Main
// website (Render Bridge), the Enrollment website and both. Needs the local WordPress (:8088, plugin with
// ACADVIZEN_CMS_RENDER_BRIDGE and the local approval switch) and a local Main build with the Render
// Bridge on (:3100). Never run against production. Setup: tests/wordpress/README.md.
//   ACV_WP_COMPOSE_DIR=<local WordPress compose folder> EDITOR_PASS_FILE=<file> node tests/wordpress/approval-acceptance.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { WP, MAIN, T, launch, login } = await import('./acceptanceKit.mjs')
if (/acadvizen\.com/.test(WP) || /acadvizen\.com/.test(MAIN)) { console.log('Refusing to run against a live site.'); process.exit(2) }
const COMPOSE_DIR = process.env.ACV_WP_COMPOSE_DIR || HERE
const EDITOR = 'acveditor'
const EDITOR_PASS_FILE = process.env.EDITOR_PASS_FILE
if (!EDITOR_PASS_FILE) { console.log('EDITOR_PASS_FILE is required.'); process.exit(2) }

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const compose = (args) => execFileSync('docker', ['compose', ...args], { cwd: COMPOSE_DIR, env: { ...process.env, MSYS_NO_PATHCONV: '1' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
const cli = (...args) => compose(['run', '--rm', '-T', 'cli', ...args.map(String)])
const act = (...args) => compose(['run', '--rm', '-T', '-v', `${path.join(HERE, 'approval-actions.php')}:/tmp/act.php:ro`, '-v', `${path.resolve(EDITOR_PASS_FILE)}:/tmp/editor-pass:ro`, 'cli', 'eval-file', '/tmp/act.php', ...args.map(String)])
const json = (s) => { try { return JSON.parse(s) } catch { return {} } }
const cron = () => { try { cli('cron', 'event', 'run', '--due-now') } catch {} }
const get = async (base, p) => { try { const r = await fetch(`${base}${p}${p.includes('?') ? '&' : '?'}t=${Date.now()}`, { redirect: 'manual', signal: AbortSignal.timeout(60000) }); return { status: r.status, html: await r.text() } } catch (e) { return { status: 0, html: String(e) } } }
const dump = (name, r) => { if (process.env.DUMP_DIR) fs.writeFileSync(path.join(process.env.DUMP_DIR, `${name}.html`), `<!-- HTTP ${r.status} -->
${r.html}`) }
const mark = (hash) => `acv-revision:${String(hash).slice(0, 16)}`
/** Runs due jobs and the verification until the publication settles (as the server cron would). */
async function settle(liveId) {
  let pub = {}
  for (let i = 1; i <= 8; i++) {
    cron()
    pub = json(act('verify', liveId, Math.min(i, 5)))
    if (pub.outcome && pub.outcome !== 'publishing') break
    await sleep(4000)
  }
  return pub
}

cli('option', 'update', 'local_approval_on', '1')
act('ensure-editor', EDITOR, '/tmp/editor-pass')
const { browser } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const editor = await login(browser, EDITOR, fs.readFileSync(EDITOR_PASS_FILE, 'utf8').trim())
const MARKER = `CMS APPROVAL TEST ${T}`
const before = { enroll: await get(WP, '/'), main: await get(MAIN, '/') }

/** Opens a document in the real Elementor editor and waits until it is ready. */
async function openElementor(page, id) {
  await page.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 180000 })
  await page.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 180000 })
  return Number(new URL(page.url()).searchParams.get('post'))
}
/** Builds a nested, styled, responsive design through Elementor's own commands (what its panel does). */
async function buildDesign(page, { heading, imageId, imageUrl, color }) {
  return page.evaluate(async ({ heading, imageId, imageUrl, color }) => {
    const root = elementor.getPreviewContainer()
    const outer = $e.run('document/elements/create', { container: root, model: { elType: 'container', settings: { flex_direction: 'row', background_background: 'classic', background_color: color, padding: { unit: 'px', top: '60', right: '20', bottom: '60', left: '20', isLinked: false }, flex_direction_mobile: 'column' } } })
    const left = $e.run('document/elements/create', { container: outer, model: { elType: 'container', isInner: true, settings: { width: { unit: '%', size: 60 } } } })
    const right = $e.run('document/elements/create', { container: outer, model: { elType: 'container', isInner: true } })
    $e.run('document/elements/create', { container: left, model: { elType: 'widget', widgetType: 'heading', settings: { title: heading, header_size: 'h1', align: 'center', title_color: '#ffffff', typography_typography: 'custom', typography_font_size: { unit: 'px', size: 52 }, typography_font_size_mobile: { unit: 'px', size: 28 }, typography_font_weight: '700' } } })
    $e.run('document/elements/create', { container: left, model: { elType: 'widget', widgetType: 'text-editor', settings: { editor: '<p>Built in the Elementor editor for the approval test.</p>' } } })
    $e.run('document/elements/create', { container: left, model: { elType: 'widget', widgetType: 'button', settings: { text: 'Enquire now', link: { url: '/contact', is_external: '', nofollow: '' }, align: 'left', align_mobile: 'center' } } })
    $e.run('document/elements/create', { container: right, model: { elType: 'widget', widgetType: 'image', settings: { image: { id: imageId, url: imageUrl }, image_size: 'full', align: 'center' } } })
    return elementor.getPreviewContainer().children.length
  }, { heading, imageId, imageUrl, color })
}
/** Changes the heading text through Elementor's settings command. */
async function setHeading(page, text) {
  return page.evaluate((text) => {
    const find = (c) => (c.model.get('widgetType') === 'heading' ? c : (c.children || []).map(find).find(Boolean))
    const heading = find(elementor.getPreviewContainer())
    $e.run('document/elements/settings', { container: heading, settings: { title: text } })
    return true
  }, text)
}
/** Elementor "Save Draft" / "Publish" (the editor's own buttons run these commands). */
async function save(page, kind) {
  await page.evaluate(async (kind) => { await $e.run(kind === 'publish' ? 'document/save/publish' : 'document/save/draft') }, kind)
  await page.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 120000 })
  await sleep(1500)
}
async function approvalsRow(page, id) {
  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  const row = page.locator(`#acv-candidate-${id}`)
  return (await row.count()) ? { state: await row.getAttribute('data-state'), approve: await row.locator('.acv-approve').count(), publish: await row.locator('.acv-publish').count(), compat: await row.locator('.acv-compat').getAttribute('data-status') } : null
}
async function clickInRow(page, id, selector, { tickPreviews = true } = {}) {
  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  // A reviewer confirms the preview of each chosen website before approving (as on the screen).
  if (selector === '.acv-approve' && tickPreviews) for (const box of await page.locator(`#acv-candidate-${id} .acv-preview-check`).all()) await box.check()
  await Promise.all([page.waitForNavigation({ timeout: 180000 }), page.locator(`#acv-candidate-${id} ${selector}`).first().dispatchEvent('click')])
}

let pageId = 0
try {
  // 0. Media: an image uploaded through WordPress (what "Upload files" in the media library does).
  const sharp = require('sharp')
  const png = await sharp({ create: { width: 640, height: 360, channels: 3, background: '#e63946' } }).png().toBuffer()
  const nonce = (await (await editor.request.get(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)).text()).trim()
  const media = await (await editor.request.post(`${WP}/wp-json/wp/v2/media`, { headers: { 'X-WP-Nonce': nonce, 'Content-Disposition': `attachment; filename="approval-${T}.png"`, 'Content-Type': 'image/png' }, data: png })).json()
  check('A0 an image is uploaded to the media library', Boolean(media.id && media.source_url), String(media.id))

  // 1. A new page built from scratch in the real Elementor editor (as an Editor, not a reviewer).
  pageId = Number(act('new-draft', EDITOR, MARKER, `cms-approval-test-${T}`))
  act('target', pageId, 'main')
  const opened = await openElementor(editor, pageId)
  check('A1 the Elementor editor opens for a new page', opened === pageId)
  await buildDesign(editor, { heading: `${MARKER} v1`, imageId: media.id, imageUrl: media.source_url, color: '#1d3557' })
  await save(editor, 'draft')
  let st = json(act('state', pageId))
  check('A1 nested containers, typography, responsive settings and the image are saved', st.post_status === 'draft' && JSON.stringify(json(act('compat', pageId)).items || []).includes('"widget":"image"'))
  check('A2 a draft is not public on either website', (await get(MAIN, `/cms-approval-test-${T}`)).status === 404 && (await get(WP, `/cms-approval-test-${T}/`)).status === 404)

  // 3. "Publish" in Elementor submits it for approval; nothing goes live.
  await save(editor, 'publish')
  st = json(act('state', pageId))
  check('A3 "Publish" by an Editor submits the exact revision for approval', st.state === 'pending' && st.post_status === 'pending' && st.hash === st.fingerprint, `${st.state}/${st.post_status}`)
  check('A3 still not public while waiting', (await get(MAIN, `/cms-approval-test-${T}`)).status === 404)

  // 4. Someone who is not a reviewer cannot approve.
  check('A4 the Editor sees no approve button', (await approvalsRow(editor, pageId))?.approve === 0)
  check('A4 the Editor cannot approve, even directly', act('review', EDITOR, pageId, 'approve') === 'not_reviewer')
  check('A4 roles: administrators review; Editors do not', JSON.stringify(json(act('caps', process.env.WP_ADMIN_USER))) === '{"review":true,"code":true}' && json(act('caps', EDITOR)).review === false)

  // 5. Approval, then an edit: the approval no longer applies.
  await clickInRow(admin, pageId, '.acv-approve', { tickPreviews: false })
  const unchecked = await admin.locator('.acv-cms-approval-flash').first().innerText().catch(() => '')
  check("A5 approving without confirming each chosen website's preview is refused", json(act('state', pageId)).state === 'pending' && /preview/i.test(unchecked), unchecked.slice(0, 90))
  await clickInRow(admin, pageId, '.acv-approve')
  st = json(act('state', pageId))
  check('A5 a reviewer approves exactly that revision', st.state === 'approved' && st.hash === st.fingerprint)
  await openElementor(editor, pageId)
  await setHeading(editor, `${MARKER} v1 edited after approval`)
  await save(editor, 'draft')
  st = json(act('state', pageId))
  check('A5 an edit after approval invalidates it', st.state === 'draft' && st.invalidated === true && st.post_status === 'draft', `${st.state}/${st.post_status}`)
  check('A5 the invalidated revision cannot be published', act('publish', process.env.WP_ADMIN_USER, pageId) === 'not_approved')

  // 6. Resubmit, approve, publish to the Main website only; verify both websites.
  await openElementor(editor, pageId)
  await save(editor, 'publish')
  await clickInRow(admin, pageId, '.acv-approve')
  await clickInRow(admin, pageId, '.acv-publish')
  let pub = await settle(pageId)
  const mainPage = await get(MAIN, `/cms-approval-test-${T}`)
  check('A6 Main only: published and verified on the Main website (approved revision shown)', pub.outcome === 'verified' && pub.destinations?.main?.state === 'verified' && mainPage.status === 200 && mainPage.html.includes(`${MARKER} v1 edited after approval`) && mainPage.html.includes(mark(pub.hash)), `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)
  check('A6 Main only: the Main page carries the design (image, button, styles)', mainPage.html.includes(media.source_url.split('/').pop()) && mainPage.html.includes('Enquire now') && /elementor-widget-heading/.test(mainPage.html))
  check('A6 Main only: the Enrollment website does not show it', (await get(WP, `/cms-approval-test-${T}/`)).status !== 200)

  // 7. The live page is protected: every way to change it directly is refused.
  await editor.goto(`${WP}/wp-admin/post.php?post=${pageId}&action=elementor`, { timeout: 180000 })
  const copyId = Number(new URL(editor.url()).searchParams.get('post'))
  check('A7 opening the live page in Elementor opens its working copy', copyId && copyId !== pageId && Number(act('working-copy', pageId)) === copyId, `${pageId} -> ${copyId}`)
  check('A7 an Elementor save of the live page is refused', act('live-save', EDITOR, pageId).startsWith('refused'))
  const restNonce = (await (await editor.request.get(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)).text()).trim()
  const restSave = await editor.request.post(`${WP}/wp-json/wp/v2/pages/${pageId}`, { headers: { 'X-WP-Nonce': restNonce, 'Content-Type': 'application/json' }, data: JSON.stringify({ title: 'changed directly' }) })
  check('A7 a block-editor (REST) save of the live page is refused', restSave.status() === 403 && (await restSave.json()).code === 'acv_live_needs_approval')
  const restTrash = await editor.request.delete(`${WP}/wp-json/wp/v2/pages/${pageId}`, { headers: { 'X-WP-Nonce': restNonce } })
  check('A7 an Editor cannot trash the live page', restTrash.status() >= 400 && json(act('state', pageId)).post_status === 'publish', String(restTrash.status()))

  // 8. Working copy → Both: one approved change reaches both websites.
  await openElementor(editor, copyId)
  await setHeading(editor, `${MARKER} v2 for both`)
  await save(editor, 'draft')
  act('target', copyId, 'both')
  await openElementor(editor, copyId)
  await save(editor, 'publish')
  await clickInRow(admin, copyId, '.acv-approve')
  await clickInRow(admin, copyId, '.acv-publish')
  pub = await settle(pageId)
  const both = { main: await get(MAIN, `/cms-approval-test-${T}`), enroll: await get(WP, `/cms-approval-test-${T}/`) }
  dump('a8-main', both.main); dump('a8-enroll', both.enroll)
  check('A8 Both: verified on both websites only when each shows the approved revision', pub.outcome === 'verified' && pub.destinations?.main?.state === 'verified' && pub.destinations?.enrollment?.state === 'verified', `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)
  check('A8 Both: the new design is live on both, the old one gone', [both.main, both.enroll].every((r) => r.status === 200 && r.html.includes(`${MARKER} v2 for both`) && !r.html.includes(`${MARKER} v1 edited`) && r.html.includes(mark(pub.hash))))
  // Responsive fidelity on both websites: the Elementor row stacks on phones and the typography follows.
  const layout = {}
  for (const [site, base, p] of [['main', MAIN, `/cms-approval-test-${T}`], ['enrollment', WP, `/cms-approval-test-${T}/`]]) {
    for (const [device, width] of [['desktop', 1440], ['tablet', 820], ['mobile', 390]]) {
      const view = await (await browser.newContext({ viewport: { width, height: 1000 } })).newPage()
      await view.goto(`${base}${p}`, { waitUntil: 'load', timeout: 180000 })
      layout[`${site}-${device}`] = await view.evaluate((marker) => {
        const h = [...document.querySelectorAll('.elementor-widget-heading .elementor-heading-title')].find((e) => e.textContent.includes(marker))
        const img = h?.closest('.e-con:not(.e-child)')?.querySelector('.elementor-widget-image img')
        if (!h || !img) return null
        const a = h.getBoundingClientRect(); const b = img.getBoundingClientRect()
        return { size: parseFloat(getComputedStyle(h).fontSize), beside: b.left >= a.right - 1, below: b.top >= a.bottom - 1, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 }
      }, MARKER)
      if (process.env.DUMP_DIR) await view.screenshot({ path: path.join(process.env.DUMP_DIR, `a8-${site}-${device}.png`), fullPage: false })
      await view.context().close()
    }
  }
  const fits = (site) => layout[`${site}-desktop`]?.beside && layout[`${site}-desktop`].size === 52 && layout[`${site}-mobile`]?.below && layout[`${site}-mobile`].size === 28 && !layout[`${site}-mobile`].overflow && !layout[`${site}-tablet`]?.overflow
  check('A8 desktop/tablet/mobile: the design keeps its layout and responsive sizes on the Main website', fits('main'), JSON.stringify({ d: layout['main-desktop'], m: layout['main-mobile'] }))
  check('A8 desktop/tablet/mobile: the same on the Enrollment website', fits('enrollment'), JSON.stringify({ d: layout['enrollment-desktop'], m: layout['enrollment-mobile'] }))
  check('A8 the working copy is gone and an archive of the previous revision exists', Number(act('working-copy', pageId)) === 0 && json(act('archives', pageId)).length >= 1)

  // 9. A failing website: partial failure is reported, never success; a retry recovers.
  await editor.goto(`${WP}/wp-admin/post.php?post=${pageId}&action=elementor`, { timeout: 180000 })
  const copy2 = Number(new URL(editor.url()).searchParams.get('post'))
  await editor.waitForFunction(() => window.elementor && window.$e && elementor.getPreviewContainer?.(), null, { timeout: 180000 })
  await setHeading(editor, `${MARKER} v3 during an outage`)
  await save(editor, 'publish')
  act('review', process.env.WP_ADMIN_USER, copy2, 'approve')
  act('render-fail', '1')
  act('publish', process.env.WP_ADMIN_USER, pageId === copy2 ? pageId : copy2)
  for (let i = 0; i < 4; i++) { cron(); await sleep(3000) }
  pub = json(act('verify', pageId, 6))
  check('A9 Main failing: reported as a partial failure naming the Main website (Enrollment verified)', pub.outcome === 'partial_failure' && pub.destinations?.main?.state === 'failed' && pub.destinations?.enrollment?.state === 'verified', `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)
  const during = await get(MAIN, `/cms-approval-test-${T}`)
  dump('a9-main', during)
  check('A9 the Main website keeps showing the previous approved revision', during.html.includes(`${MARKER} v2 for both`), `HTTP ${during.status} ${(during.html.match(/v[123] [a-z ]+/) || [''])[0]}`)
  act('render-fail', '0')
  // The reviewer's "Check again" on Approvals → Recent publications retries the failed website.
  await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  await Promise.all([admin.waitForNavigation({ timeout: 180000 }), admin.locator(`a.acv-verify[href*="post=${pageId}&"]`).first().dispatchEvent('click')])
  const retried = json(act('publication', pageId))
  check('A9 "Check again" puts the failed website back to checking (and redraws it)', retried.outcome === 'publishing' && retried.destinations?.main?.state === 'pending' && retried.destinations?.enrollment?.state === 'verified', `${retried.outcome} ${JSON.stringify(retried.destinations || {})}`)
  pub = await settle(pageId)
  check('A9 after the cause is fixed, the retry verifies both', pub.outcome === 'verified', `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)

  // 10. Rollback to the previous approved revision, verified on both websites.
  const archives = json(act('archives', pageId))
  check('A10 only a reviewer can roll back', act('rollback', EDITOR, pageId, archives[0]) === 'not_reviewer')
  check('A10 rollback starts', act('rollback', process.env.WP_ADMIN_USER, pageId, archives[0]) === 'publishing')
  pub = await settle(pageId)
  const rolled = { main: await get(MAIN, `/cms-approval-test-${T}`), enroll: await get(WP, `/cms-approval-test-${T}/`) }
  dump('a10-main', rolled.main); dump('a10-enroll', rolled.enroll)
  check('A10 rollback: the previous revision is back and verified on both websites', pub.outcome === 'verified' && [rolled.main, rolled.enroll].every((r) => r.html.includes(`${MARKER} v2 for both`) && !r.html.includes('v3 during an outage')), `${pub.outcome}`)

  // 11. Designs that cannot be reproduced, and typed code.
  const missing = Number(act('new-draft', EDITOR, `${MARKER} missing widget`, `cms-approval-missing-${T}`))
  act('design', missing, JSON.stringify([{ id: 'm1', elType: 'container', settings: {}, elements: [{ id: 'm2', elType: 'widget', widgetType: 'acv-not-installed-widget', settings: {}, elements: [] }] }]))
  const refused = act('submit', EDITOR, missing)
  check('A11 a design using a widget that is not installed cannot be submitted, with the reason', refused === 'blocked_widgets' && json(act('state', missing)).post_status === 'draft' && json(act('compat', missing)).status === 'blocked')
  const coded = Number(act('new-draft', EDITOR, `${MARKER} typed code`, `cms-approval-code-${T}`))
  act('design', coded, JSON.stringify([{ id: 'c1', elType: 'container', settings: {}, elements: [{ id: 'c2', elType: 'widget', widgetType: 'html', settings: { html: '<script>console.log(1)</script>' }, elements: [] }] }]))
  check('A11 typed HTML/code can be submitted (to Enrollment)', act('submit', EDITOR, coded) === 'pending')
  check('A11 typed code is not approved without a code review', act('review', process.env.WP_ADMIN_USER, coded, 'approve') === 'code_needs_review')
  check('A11 a reviewer who may publish code confirms it explicitly', act('review', process.env.WP_ADMIN_USER, coded, 'approve', '1') === 'approved')

  // 12. Global styles change both websites: reviewers only.
  check('A12 an Editor cannot save the global styles', act('kit-save', EDITOR).startsWith('refused'))
  check('A12 a reviewer can (recorded in the history)', act('kit-save', process.env.WP_ADMIN_USER) === 'allowed')

  // 13. Unrelated content is unchanged.
  const after = { enroll: await get(WP, '/'), main: await get(MAIN, '/') }
  check('A13 the Enrollment and Main homepages still answer as before', after.enroll.status === before.enroll.status && after.main.status === before.main.status)

  // 14. "Main homepage" ticked on a page that is not live changes nothing until it is approved.
  const ADMIN = process.env.WP_ADMIN_USER
  act('set-homepage-flag', pageId)
  const home2 = Number(act('new-draft', ADMIN, `${MARKER} homepage candidate`, `cms-approval-home-${T}`))
  // A page needs a design to be approved (an empty Elementor design is blocked).
  act('design', home2, JSON.stringify([{ id: 'h1', elType: 'container', settings: {}, elements: [{ id: 'h2', elType: 'widget', widgetType: 'heading', settings: { title: `${MARKER} new homepage` }, elements: [] }] }]))
  act('target', home2, 'enrollment')
  act('site-box-save', ADMIN, home2, '1')
  check('A14 ticking "Main homepage" on a draft leaves the live homepage as it is', act('homepage-flag', pageId) === '1' && act('homepage-flag', home2) === '1')
  act('submit', ADMIN, home2); act('review', ADMIN, home2, 'approve')
  check('A14 once approved and published, it becomes the homepage and the previous one steps back', Number(act('publish', ADMIN, home2)) === home2 && act('homepage-flag', pageId) === '' && act('homepage-flag', home2) === '1')

  // 15. Import Main Website under approval: nothing goes live without a reviewer.
  const design = (text) => [{ id: 'i1', elType: 'container', settings: {}, elements: [{ id: 'i2', elType: 'widget', widgetType: 'heading', settings: { title: text }, elements: [] }] }]
  const item = (text) => JSON.stringify({ key: `approval-import-${T}`, post_type: 'page', title: `${MARKER} import`, slug: `cms-approval-import-${T}`, status: 'publish', target: 'both', main_path: `/cms-approval-import-${T}`, elementor_data: design(text) })
  const first = act('import-record', ADMIN, item(`${MARKER} imported v1`))
  const [imported] = json(act('by-source', `approval-import-${T}`))
  check('A15 an imported page is submitted for approval, not published', first.includes('waiting for approval') && json(act('state', imported)).post_status === 'pending' && (await get(WP, `/cms-approval-import-${T}/`)).status !== 200, first)
  act('review', ADMIN, imported, 'approve'); act('publish', ADMIN, imported)
  pub = await settle(imported)
  check('A15 after approval it is published and verified on both websites', pub.outcome === 'verified' && (await get(WP, `/cms-approval-import-${T}/`)).html.includes('imported v1') && (await get(MAIN, `/cms-approval-import-${T}`)).html.includes('imported v1'), `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)
  const again = act('import-record', ADMIN, item(`${MARKER} imported v2`))
  const importCopy = Number(act('working-copy', imported))
  check('A15 re-importing a live page writes its working copy and submits it; the live page is unchanged', again.includes('working copy of live') && again.includes('waiting for approval') && importCopy > 0 && json(act('state', importCopy)).state === 'pending' && (await get(WP, `/cms-approval-import-${T}/`)).html.includes('imported v1') && !(await get(MAIN, `/cms-approval-import-${T}`)).html.includes('imported v2'), again)
  check('A15 the importer still finds only the live page for its source (never its copy)', JSON.stringify(json(act('by-source', `approval-import-${T}`))) === JSON.stringify([imported]))
  check("A15 a page's working copy does not count as another page using its Main address; other pages do", act('path-taken', `/cms-approval-import-${T}`, importCopy) === 'no' && act('path-taken', `/cms-approval-import-${T}`, home2) === 'yes')
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  const removed = act('cleanup', MARKER)
  act('render-fail', '0')
  cli('option', 'delete', 'local_approval_on')
  for (let i = 0; i < 2; i++) cron()
  // Where a visitor ends up (a just-removed page may first send them once to Main's own page, 307).
  const gone = await fetch(`${MAIN}/cms-approval-test-${T}?t=${Date.now()}`, { redirect: 'follow', signal: AbortSignal.timeout(60000) }).then((r) => ({ status: r.status })).catch(() => ({ status: 0 }))
  check('Z cleanup: test content removed from both websites', Number(removed) >= 1 && gone.status === 404, `${removed} removed; Main answers ${gone.status}`)
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed [LOCAL]`)
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
  await browser.close()
}
