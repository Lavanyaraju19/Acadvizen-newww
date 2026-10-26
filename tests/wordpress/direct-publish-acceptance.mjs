// LOCAL acceptance test (plugin 0.7.9): with approval on, "Publish" / "Update" in the real Elementor editor by
// an administrator (a reviewer) publishes, as in normal WordPress; an Editor's "Publish" still only submits.
// Also: a publication whose next check was lost is resumed. Needs the stack of approval-acceptance.mjs
// (local WordPress :8088 with the local approval switch, local Main :3100 with the Render Bridge).
// Never run against production. Setup: tests/wordpress/README.md.
//   ACV_WP_COMPOSE_DIR=<compose folder> WP_ADMIN_USER=… WP_ADMIN_PASS=… EDITOR_PASS_FILE=<file> node tests/wordpress/direct-publish-acceptance.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
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
async function openElementor(page, id) {
  await page.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 180000 })
  await page.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 180000 })
  return Number(new URL(page.url()).searchParams.get('post'))
}
async function addHeading(page, text) {
  return page.evaluate((text) => {
    const box = $e.run('document/elements/create', { container: elementor.getPreviewContainer(), model: { elType: 'container', settings: { background_background: 'classic', background_color: '#14213d' } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'heading', settings: { title: text, header_size: 'h1', title_color: '#ffffff' } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'button', settings: { text: 'Talk to us', link: { url: '/contact' } } } })
    return true
  }, text)
}
async function setHeading(page, text) {
  return page.evaluate((text) => {
    const find = (c) => (c.model.get('widgetType') === 'heading' ? c : (c.children || []).map(find).find(Boolean))
    $e.run('document/elements/settings', { container: find(elementor.getPreviewContainer()), settings: { title: text } })
    return true
  }, text)
}
async function save(page, kind) {
  await page.evaluate(async (kind) => { await $e.run(kind === 'publish' ? 'document/save/publish' : 'document/save/draft') }, kind)
  await page.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 120000 })
  await sleep(1500)
}

cli('option', 'update', 'local_approval_on', '1')
act('ensure-editor', EDITOR, '/tmp/editor-pass')
const { browser } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const editor = await login(browser, EDITOR, fs.readFileSync(EDITOR_PASS_FILE, 'utf8').trim())
const MARKER = `CMS DIRECT PUBLISH TEST ${T}`
const slug = `cms-direct-publish-${T}`
try {
  // D1. A new page: an administrator's "Publish" in Elementor publishes it to Main (no Approvals step).
  const pageId = Number(act('new-draft', process.env.WP_ADMIN_USER, MARKER, slug))
  act('target', pageId, 'main')
  await openElementor(admin, pageId)
  await addHeading(admin, `${MARKER} v1`)
  await save(admin, 'draft')
  check('D1 a draft is not public', (await get(MAIN, `/${slug}`)).status === 404)
  await save(admin, 'publish')
  let st = json(act('state', pageId))
  check('D1 an administrator\'s Publish publishes at once (approval recorded as their own)', st.post_status === 'publish' && ['publishing', 'published'].includes(st.state), `${st.state}/${st.post_status}`)
  let pub = await settle(pageId)
  let live = await get(MAIN, `/${slug}`)
  check('D1 verified on the Main website, showing the design', pub.outcome === 'verified' && live.status === 200 && live.html.includes(`${MARKER} v1`) && live.html.includes('Talk to us'), `${pub.outcome} HTTP ${live.status}`)
  check("D1 the Main page links Elementor's dialog styles (popups and lightboxes open as overlays)", /css\/conditionals\/dialog\.min\.css/.test(live.html))
  check('D1 recorded in the approval history', Number(act('log-has', 'approve', 'approved')) > 0)

  // D2. Changing the live page: Elementor opens its working copy; "Publish" there publishes the change.
  const copyId = await openElementor(admin, pageId)
  check('D2 the live page opens as its working copy', copyId && copyId !== pageId, `${pageId} -> ${copyId}`)
  await setHeading(admin, `${MARKER} v2`)
  await save(admin, 'publish')
  pub = await settle(pageId)
  live = await get(MAIN, `/${slug}`)
  check('D2 the change is live and verified; the previous version is kept for rollback', pub.outcome === 'verified' && live.html.includes(`${MARKER} v2`) && !live.html.includes(`${MARKER} v1`) && json(act('archives', pageId)).length >= 1, pub.outcome)

  // D3. A second update from the same editor tab reaches the website too.
  await setHeading(admin, `${MARKER} v3`)
  await save(admin, 'publish')
  pub = await settle(pageId)
  live = await get(MAIN, `/${slug}`)
  check('D3 a second Update from the same editor is live and verified', pub.outcome === 'verified' && live.html.includes(`${MARKER} v3`) && !live.html.includes(`${MARKER} v2`), pub.outcome)

  // D4. An Editor (not a reviewer) still only submits; the live page does not change. The administrator
  // closes the editor first (otherwise WordPress shows the Editor "being edited by" and locks them out).
  const handOver = async (page, id) => { page.on("dialog", (d) => d.accept().catch(() => {})); await page.goto("about:blank", { timeout: 120000 }); act('set-meta', id, '_edit_lock', '1:1') }
  await handOver(admin, copyId)
  const editorCopy = await openElementor(editor, pageId)
  await setHeading(editor, `${MARKER} v4 by an editor`)
  await save(editor, 'publish')
  st = json(act('state', editorCopy))
  live = await get(MAIN, `/${slug}`)
  check('D4 an Editor\'s Publish submits for approval; the live page keeps the published version', st.state === 'pending' && live.html.includes(`${MARKER} v3`) && !live.html.includes('v4 by an editor'), `${st.state}/${st.post_status}`)

  // D5. An administrator opening that page gets the same working copy; their Publish publishes it.
  await handOver(editor, editorCopy)
  const sameCopy = await openElementor(admin, pageId)
  await save(admin, 'publish')
  pub = await settle(pageId)
  live = await get(MAIN, `/${slug}`)
  check('D5 an administrator publishes the waiting change with Publish', sameCopy === editorCopy && pub.outcome === 'verified' && live.html.includes('v4 by an editor'), `${sameCopy}/${editorCopy} ${pub.outcome}`)

  // D6. A future date: the administrator's Publish schedules it instead.
  const futureId = Number(act('new-draft', process.env.WP_ADMIN_USER, `${MARKER} scheduled`, `${slug}-scheduled`))
  act('target', futureId, 'main')
  act('set-date', futureId, Math.floor(Date.now() / 1000) + 3600)
  await openElementor(admin, futureId)
  await addHeading(admin, `${MARKER} scheduled`)
  await save(admin, 'publish')
  st = json(act('state', futureId))
  check('D6 Publish with a future date schedules it; nothing is public yet', st.state === 'scheduled' && Number(act('scheduled-job', futureId)) > 0 && (await get(MAIN, `/${slug}-scheduled`)).status === 404, st.state)

  // D8. An administrator who explicitly asks for review ("Pending Review", block editor / REST) submits, not publishes.
  const reviewId = Number(act('new-draft', process.env.WP_ADMIN_USER, `${MARKER} for review`, `${slug}-review`))
  act('target', reviewId, 'main')
  act('design', reviewId, JSON.stringify([{ id: 'r1', elType: 'container', settings: {}, elements: [{ id: 'r2', elType: 'widget', widgetType: 'heading', settings: { title: `${MARKER} for review` }, elements: [] }] }]))
  const nonce = (await (await admin.request.get(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)).text()).trim()
  const asked = await admin.request.post(`${WP}/wp-json/wp/v2/pages/${reviewId}`, { headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: JSON.stringify({ status: 'pending' }) })
  st = json(act('state', reviewId))
  check('D8 an administrator\'s "Pending Review" stays a submission for approval (not published)', asked.status() === 200 && st.state === 'pending' && st.post_status === 'pending' && (await get(MAIN, `/${slug}-review`)).status === 404, `${asked.status()} ${st.state}/${st.post_status}`)

  // D7. A publication whose next check was lost is resumed and settles.
  act('lose-verification', pageId)
  const resumed = Number(act('resume-verifications'))
  pub = await settle(pageId)
  check('D7 a lost check is started again and the publication settles as verified', resumed >= 1 && pub.outcome === 'verified', `${resumed} resumed, ${pub.outcome}`)
} finally {
  const removed = act('cleanup', MARKER)
  cli('option', 'delete', 'local_approval_on')
  for (let i = 0; i < 2; i++) cron()
  console.log(`cleanup: ${removed} test documents removed`)
  await browser.close()
}
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
