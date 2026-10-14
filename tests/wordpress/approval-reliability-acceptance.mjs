// LOCAL acceptance test: publishing reliability under approval. Covers:
//   - each destination failing (Enrollment only, then both) with honest reporting and recovery;
//   - a repeated or replayed publish (no duplicate, no bypass of approval);
//   - scheduled publishing of an approved revision (time, cancellation, an edit after scheduling);
//   - approval switched off.
// Same setup as approval-acceptance.mjs (tests/wordpress/README.md). Never run against production.
//   EDITOR_PASS_FILE=<file> node tests/wordpress/approval-reliability-acceptance.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const { WP, MAIN, T, launch, login } = await import('./acceptanceKit.mjs')
if (/acadvizen\.com/.test(WP) || /acadvizen\.com/.test(MAIN)) { console.log('Refusing to run against a live site.'); process.exit(2) }
const COMPOSE_DIR = process.env.ACV_WP_COMPOSE_DIR || HERE
const EDITOR = 'acveditor'
const ADMIN = process.env.WP_ADMIN_USER
const EDITOR_PASS_FILE = process.env.EDITOR_PASS_FILE
if (!EDITOR_PASS_FILE || !ADMIN) { console.log('WP_ADMIN_USER, WP_ADMIN_PASS and EDITOR_PASS_FILE are required.'); process.exit(2) }

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const compose = (args) => execFileSync('docker', ['compose', ...args], { cwd: COMPOSE_DIR, env: { ...process.env, MSYS_NO_PATHCONV: '1' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
const cli = (...args) => compose(['run', '--rm', '-T', 'cli', ...args.map(String)])
const act = (...args) => compose(['run', '--rm', '-T', '-v', `${path.join(HERE, 'approval-actions.php')}:/tmp/act.php:ro`, '-v', `${path.resolve(EDITOR_PASS_FILE)}:/tmp/editor-pass:ro`, 'cli', 'eval-file', '/tmp/act.php', ...args.map(String)])
const json = (s) => { try { return JSON.parse(s) } catch { return {} } }
const cron = () => { try { cli('cron', 'event', 'run', '--due-now') } catch {} }
// Every request has a deadline: a hung response must fail the step, not stall the run.
const get = async (base, p) => { try { const r = await fetch(`${base}${p}${p.includes('?') ? '&' : '?'}t=${Date.now()}`, { redirect: 'manual', signal: AbortSignal.timeout(60000) }); return { status: r.status, html: await r.text() } } catch (e) { return { status: 0, html: String(e) } } }
const mark = (hash) => `acv-revision:${String(hash).slice(0, 16)}`
const design = (text) => JSON.stringify([{ id: 'r1', elType: 'container', settings: {}, elements: [{ id: 'r2', elType: 'widget', widgetType: 'heading', settings: { title: text }, elements: [] }] }])
const both = async (slug) => ({ main: await get(MAIN, `/${slug}`), enroll: await get(WP, `/${slug}/`) })
/** Runs due jobs and the checks until the publication settles (as the server cron would). */
async function settle(liveId, until = 8) {
  let pub = {}
  for (let i = 1; i <= until; i++) {
    cron()
    pub = json(act('verify', liveId, Math.min(i, 5)))
    if (pub.outcome && pub.outcome !== 'publishing') break
    await sleep(4000)
  }
  return pub
}
/** Runs the checks to their last attempt, so a website that never shows the revision is reported failed. */
async function finalCheck(liveId) {
  for (let i = 0; i < 4; i++) { cron(); await sleep(3000) }
  return json(act('verify', liveId, 6))
}
/** A new page, designed, with a destination, submitted by the Editor and approved by a reviewer. */
function approvedPage(title, slug, target, text) {
  const id = Number(act('new-draft', EDITOR, title, slug))
  act('design', id, design(text))
  act('target', id, target)
  const submitted = act('submit', EDITOR, id)
  const approved = act('review', ADMIN, id, 'approve')
  return { id, submitted, approved }
}

cli('option', 'update', 'local_approval_on', '1')
act('ensure-editor', EDITOR, '/tmp/editor-pass')
act('render-fail', '0'); act('enroll-fail', '0')
const { browser } = await launch()
const admin = await login(browser, ADMIN, process.env.WP_ADMIN_PASS)
const editor = await login(browser, EDITOR, fs.readFileSync(EDITOR_PASS_FILE, 'utf8').trim())
const MARKER = `CMS RELIABILITY TEST ${T}`
const menus = []

try {
  // R1. Enrollment failing during Both: reported as a partial failure naming Enrollment; Main verified.
  const s1 = `cms-reliability-a-${T}`
  const p1 = approvedPage(`${MARKER} enrollment outage`, s1, 'both', `${MARKER} A1`)
  check('R0 setup: submitted and approved', p1.submitted === 'pending' && p1.approved === 'approved', `${p1.submitted}/${p1.approved}`)
  act('enroll-fail', '1')
  act('publish', ADMIN, p1.id)
  let pub = await finalCheck(p1.id)
  check('R1 Enrollment failing: partial failure naming Enrollment, Main verified, never "verified"', pub.outcome === 'partial_failure' && pub.destinations?.enrollment?.state === 'failed' && pub.destinations?.main?.state === 'verified', `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)
  act('enroll-fail', '0')
  check('R1 "Check again" retries only the failed website', act('retry', ADMIN, p1.id) === 'retrying' && json(act('publication', p1.id)).destinations?.main?.state === 'verified')
  pub = await settle(p1.id)
  check('R1 after recovery: verified on both', pub.outcome === 'verified', `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)
  check('R1 nothing left to retry once verified', act('retry', ADMIN, p1.id) === 'nothing_failed')

  // R2. Both websites failing: reported as failed (not success, not partial); recovery verifies both.
  const s2 = `cms-reliability-b-${T}`
  const p2 = approvedPage(`${MARKER} both outage`, s2, 'both', `${MARKER} B1`)
  act('render-fail', '1'); act('enroll-fail', '1')
  act('publish', ADMIN, p2.id)
  pub = await finalCheck(p2.id)
  check('R2 both failing: reported as failed, each website named', pub.outcome === 'failed' && pub.destinations?.main?.state === 'failed' && pub.destinations?.enrollment?.state === 'failed', `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)
  check('R2 Main shows nothing for a page that never reached it', (await get(MAIN, `/${s2}`)).status === 404)
  act('render-fail', '0'); act('enroll-fail', '0')
  act('retry', ADMIN, p2.id)
  pub = await settle(p2.id)
  const r2 = await both(s2)
  check('R2 after both recover, one "Check again" verifies both, showing the approved revision', pub.outcome === 'verified' && [r2.main, r2.enroll].every((r) => r.status === 200 && r.html.includes(`${MARKER} B1`) && r.html.includes(mark(pub.hash))), `${pub.outcome}`)

  // R3. Repeated and replayed publishing: refused, nothing duplicated, approval never bypassed.
  check('R3 publishing the same approved revision again is refused', act('publish', ADMIN, p2.id) === 'not_approved')
  const s3 = `cms-reliability-c-${T}`
  const p3 = approvedPage(`${MARKER} replay`, s3, 'enrollment', `${MARKER} C1`)
  await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  const publishHref = await admin.locator(`#acv-candidate-${p3.id} .acv-publish`).getAttribute('href')
  await admin.goto(publishHref)
  await admin.goto(publishHref) // the same signed link again (a double click, a reload, a replay)
  const notice = await admin.locator('.acv-cms-approval-flash').first().innerText().catch(() => '')
  pub = await settle(p3.id)
  check('R3 a replayed publish link is refused with a clear message, the first one counts once', /not approved|approval/i.test(notice) && pub.outcome === 'verified', notice.slice(0, 100))
  check('R3 exactly one page exists for it, and no archive was made by the replay', act('count-titled', `${MARKER} replay`) === '1' && json(act('archives', p3.id)).length === 0)
  const fakeUrl = publishHref.replace(/_wpnonce=[^&]+/, '_wpnonce=0000000000')
  const forged = await admin.request.get(fakeUrl)
  check('R3 a publish request with a wrong signature (nonce) is refused', forged.status() === 403 || /link you followed has expired|not allowed/i.test(await forged.text()))
  await editor.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  const waiting = Number(act('new-draft', EDITOR, `${MARKER} replay 2`, `cms-reliability-c2-${T}`))
  act('design', waiting, design('x')); act('submit', EDITOR, waiting)
  await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  const approveHref = await admin.locator(`#acv-candidate-${waiting} form`).first().getAttribute('action')
  const replayed = await editor.request.post(new URL(approveHref, WP).href, { form: { code_ok: '' } })
  check("R3 an Editor replaying a reviewer's approve request (the same signed link) is refused; it stays waiting", replayed.status() === 403 && json(act('state', waiting)).state === 'pending', String(replayed.status()))

  // R4. Scheduled publishing: the approved revision goes live at its time, not before.
  const s4 = `cms-reliability-d-${T}`
  const p4 = { id: Number(act('new-draft', EDITOR, `${MARKER} scheduled`, s4)) }
  act('design', p4.id, design(`${MARKER} D1`))
  act('target', p4.id, 'both')
  const at = Math.floor(Date.now() / 1000) + 600
  act('set-date', p4.id, at)
  act('submit', EDITOR, p4.id); act('review', ADMIN, p4.id, 'approve')
  await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  const label = await admin.locator(`#acv-candidate-${p4.id} .acv-publish`).innerText()
  check('R4 a dated page offers "Schedule approved revision for <time>"', /Schedule approved revision for/.test(label), label)
  check('R4 publishing it schedules it instead', act('publish', ADMIN, p4.id) === 'scheduled' && json(act('state', p4.id)).state === 'scheduled' && Math.abs(Number(act('scheduled-job', p4.id)) - at) <= 1)
  let r4 = await both(s4)
  check('R4 not public before its time on either website', r4.main.status === 404 && r4.enroll.status !== 200, `${r4.main.status}/${r4.enroll.status}`)
  check('R4 a scheduled revision cannot be published early by hand', act('publish', ADMIN, p4.id) === 'already_scheduled')
  await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  check('R4 Approvals shows "Scheduled for …" with "Cancel schedule"', (await admin.locator(`#acv-candidate-${p4.id} .acv-scheduled`).count()) === 1 && (await admin.locator(`#acv-candidate-${p4.id} .acv-unschedule`).count()) === 1)
  // A lost job (WP-Cron lost it, or the plugin was deactivated meanwhile) is restored, at the same time.
  act('drop-scheduled-job', p4.id)
  const lost = act('scheduled-job', p4.id)
  await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  check('R4 a lost scheduled job is restored, at its time, when Approvals is opened', lost === '0' && Math.abs(Number(act('scheduled-job', p4.id)) - at) <= 1, `lost ${lost}, restored ${act('scheduled-job', p4.id)}`)
  // An edit after scheduling: the job refuses the changed revision when it runs.
  act('design', p4.id, design(`${MARKER} D1 changed after scheduling`))
  act('run-scheduled', p4.id)
  r4 = await both(s4)
  check('R4 a revision changed after scheduling is not published when its time comes', json(act('state', p4.id)).state === 'draft' && r4.main.status === 404 && r4.enroll.status !== 200, json(act('state', p4.id)).state)
  // Resubmitted and approved, scheduled, cancelled, scheduled again, and due.
  act('submit', EDITOR, p4.id); act('review', ADMIN, p4.id, 'approve')
  act('publish', ADMIN, p4.id)
  check('R4 "Cancel schedule" keeps the approval and removes the job', act('unschedule', ADMIN, p4.id) === 'approved' && act('scheduled-job', p4.id) === '0')
  check('R4 scheduled again', act('publish', ADMIN, p4.id) === 'scheduled')
  act('run-scheduled', p4.id) // its time has come (run now, as WP-Cron would at that time)
  pub = await settle(p4.id)
  r4 = await both(s4)
  check('R4 when due, exactly the approved revision is published and verified on both websites', pub.outcome === 'verified' && [r4.main, r4.enroll].every((r) => r.status === 200 && r.html.includes('D1 changed after scheduling') && r.html.includes(mark(pub.hash))), pub.outcome)
  const history = cli('option', 'get', 'acv_cms_approval_log', '--format=json')
  check('R4 the history records scheduling, the cancelled run and the scheduled publication', /"action":"schedule"/.test(history) && /"action":"schedule_cancelled"/.test(history) && /"action":"scheduled_publish","post":\d+,"title":"[^"]*","outcome":"refused"/.test(history) && /"action":"scheduled_publish","post":\d+,"title":"[^"]*","outcome":"publishing"/.test(history))

  // R6. SEO is part of the approved revision: a changed SEO title needs a new approval.
  const s6 = `cms-reliability-f-${T}`
  const p6 = approvedPage(`${MARKER} seo`, s6, 'both', `${MARKER} F1`)
  act('set-meta', p6.id, 'rank_math_title', `${MARKER} changed SEO title`)
  check('R6 an SEO title changed after approval: publishing is refused', act('publish', ADMIN, p6.id) === 'changed_since_approved')
  check('R6 and the next save cancels the approval (back to draft for a new approval)', act('touch-save', EDITOR, p6.id) === 'draft')

  // R7. Navigation shown on Main: reviewer-only; Enrollment-only menus keep their usual workflow.
  // Editors cannot edit menus by default; sites often let them. Grant it for this step only.
  check('R7 setup: the Editor may edit menus (as on sites that allow it)', act('user-cap', EDITOR, 'edit_theme_options', '1') === 'yes')
  const mainMenu = Number(act('make-menu', `${MARKER} main menu`, '1')); menus.push(mainMenu)
  const enrollMenu = Number(act('make-menu', `${MARKER} enrollment menu`, '0')); menus.push(enrollMenu)
  const saveMenu = async (page, id) => {
    await page.goto(`${WP}/wp-admin/nav-menus.php?action=edit&menu=${id}`)
    const [response] = await Promise.all([page.waitForNavigation({ timeout: 120000 }), page.locator('#save_menu_footer, #save_menu_header').first().dispatchEvent('click')])
    return { status: response ? response.status() : 0, text: await page.locator('body').innerText().catch(() => '') }
  }
  const byEditor = await saveMenu(editor, mainMenu)
  check('R7 an Editor cannot save a menu shown on the Main website (Appearance > Menus)', byEditor.status === 403 && /only a reviewer can save it/i.test(byEditor.text), `HTTP ${byEditor.status}`)
  const restNonce7 = (await (await editor.request.get(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)).text()).trim()
  const restItem = await editor.request.post(`${WP}/wp-json/wp/v2/menu-items`, { headers: { 'X-WP-Nonce': restNonce7, 'Content-Type': 'application/json' }, data: JSON.stringify({ title: 'Injected', url: 'https://example.invalid/', menus: mainMenu, status: 'publish' }) })
  check('R7 nor through the REST menu routes', restItem.status() === 403 && (await restItem.json().catch(() => ({}))).code === 'acv_main_menu_needs_reviewer' && !JSON.stringify(json(act('menu-items', mainMenu))).includes('Injected'), String(restItem.status()))
  const byReviewer = await saveMenu(admin, mainMenu)
  check('R7 a reviewer can, and it is recorded in the history', byReviewer.status === 200 && Number(act('log-has', 'navigation', 'saved_by_reviewer')) >= 1, `HTTP ${byReviewer.status}`)
  const enrollSave = await saveMenu(editor, enrollMenu)
  check('R7 an Editor still saves an Enrollment-only menu as before', enrollSave.status === 200 && !/only a reviewer/i.test(enrollSave.text), `HTTP ${enrollSave.status}`)

  // R8. Main-only rollback ("Make live" of an earlier Main version): reviewers only, recorded.
  const versions8 = json(act('main-versions', p1.id))
  const oldest8 = Array.isArray(versions8) ? versions8[versions8.length - 1] : 0
  const editorRollback = act('main-rollback', EDITOR, p1.id, oldest8)
  check('R8 an Editor cannot put an earlier version back on the Main website ("Make live")', /^refused:.*Only a reviewer/.test(editorRollback), editorRollback.slice(0, 90))
  const reviewerRollback = act('main-rollback', ADMIN, p1.id, oldest8)
  check('R8 a reviewer can (Main-only rollback), and it is recorded', /^done:.*acv_notice=rolled_back/.test(reviewerRollback) && Number(act('log-has', 'main_rollback', 'by_reviewer')) >= 1, reviewerRollback.slice(0, 90))

  // R5. Approval switched off: nothing waiting is published by it, and the approval screens go away.
  const s5 = `cms-reliability-e-${T}`
  const p5 = approvedPage(`${MARKER} waiting when switched off`, s5, 'both', `${MARKER} E1`)
  cli('option', 'delete', 'local_approval_on')
  check('R5 approval is off', act('approval-enabled') === 'approval-off')
  for (let i = 0; i < 2; i++) { cron(); await sleep(2000) }
  const r5 = await both(s5)
  check('R5 an approved but unpublished page does not go live when approval is switched off', r5.main.status === 404 && r5.enroll.status !== 200 && json(act('state', p5.id)).post_status === 'pending', `${r5.main.status}/${r5.enroll.status}`)
  await editor.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  check('R5 the Approvals screen is not offered while approval is off', !(await editor.locator('h1', { hasText: 'Approvals' }).count()))
  check('R5 live pages stay live (nothing is unpublished by switching off)', (await get(WP, `/${s1}/`)).status === 200 && (await get(MAIN, `/${s1}`)).status === 200)
  cli('option', 'update', 'local_approval_on', '1')
} catch (error) {
  check('run finished without an unexpected error', false, String(error.message || error).split('\n')[0])
} finally {
  act('render-fail', '0'); act('enroll-fail', '0')
  for (const id of menus) act('delete-menu', id)
  act('user-cap', EDITOR, 'edit_theme_options', '0')
  const removed = act('cleanup', MARKER)
  cli('option', 'delete', 'local_approval_on')
  for (let i = 0; i < 2; i++) cron()
  // Where a visitor ends up (a just-removed page may first send them once to Main's own page, 307).
  const gone = await fetch(`${MAIN}/cms-reliability-a-${T}?t=${Date.now()}`, { redirect: 'follow', signal: AbortSignal.timeout(60000) }).then((r) => ({ status: r.status })).catch(() => ({ status: 0 }))
  check('Z cleanup: test content removed from both websites', Number(removed) >= 1 && gone.status === 404, `${removed} removed; Main answers ${gone.status}`)
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed [LOCAL]`)
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
  await browser.close()
}
