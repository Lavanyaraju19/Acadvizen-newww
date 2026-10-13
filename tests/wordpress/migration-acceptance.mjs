// LOCAL acceptance test: moving one existing Main Website page into WordPress/Elementor, under approval.
//   1. Convert the page with tools/main-to-elementor (BUNDLE: built beforehand from the local Main build).
//   2. Import it (Import Main Website).
//   3. A reviewer approves and publishes it over its Main address.
//   4. Compare it with the original: text, title, description, canonical, and visuals at desktop and phone.
//   5. Take it off line again; Main serves its own page.
//   6. Undo the import.
// Same setup as approval-acceptance.mjs (tests/wordpress/README.md). Never run against production.
//   BUNDLE=<bundle.json> MIGRATE_PATH=/soft-skills EDITOR_PASS_FILE=<file> node tests/wordpress/migration-acceptance.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const { WP, MAIN, launch, login, diffRatio } = await import('./acceptanceKit.mjs')
if (/acadvizen\.com/.test(WP) || /acadvizen\.com/.test(MAIN)) { console.log('Refusing to run against a live site.'); process.exit(2) }
const COMPOSE_DIR = process.env.ACV_WP_COMPOSE_DIR || HERE
const ADMIN = process.env.WP_ADMIN_USER
const BUNDLE = process.env.BUNDLE
const PAGE = process.env.MIGRATE_PATH || '/soft-skills'
const OUT = process.env.DUMP_DIR || fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'acv-migration-'))
if (!BUNDLE || !ADMIN || !process.env.EDITOR_PASS_FILE) { console.log('BUNDLE, WP_ADMIN_USER, WP_ADMIN_PASS and EDITOR_PASS_FILE are required.'); process.exit(2) }

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const compose = (args) => execFileSync('docker', ['compose', ...args], { cwd: COMPOSE_DIR, env: { ...process.env, MSYS_NO_PATHCONV: '1' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
const cli = (...args) => compose(['run', '--rm', '-T', 'cli', ...args.map(String)])
const act = (...args) => compose(['run', '--rm', '-T', '-v', `${path.join(HERE, 'approval-actions.php')}:/tmp/act.php:ro`, '-v', `${path.resolve(BUNDLE)}:/tmp/bundle.json:ro`, 'cli', 'eval-file', '/tmp/act.php', ...args.map(String)])
const json = (s) => { try { return JSON.parse(s) } catch { return {} } }
const cron = () => { try { cli('cron', 'event', 'run', '--due-now') } catch {} }
const get = async (p) => { try { const r = await fetch(`${MAIN}${p}?t=${Date.now()}`, { redirect: 'follow', signal: AbortSignal.timeout(60000) }); return { status: r.status, html: await r.text() } } catch (e) { return { status: 0, html: '' } } }
const isBridged = (html) => /acv-revision:[0-9a-f]{16}/.test(html)
async function settle(liveId) {
  let pub = {}
  for (let i = 1; i <= 10; i++) {
    cron()
    pub = json(act('verify', liveId, Math.min(i, 5)))
    if (pub.outcome && pub.outcome !== 'publishing') break
    await sleep(5000)
  }
  return pub
}
/** What a visitor reads and what search engines see, plus a screenshot, at one width. */
async function capture(browser, label, width) {
  const page = await (await browser.newContext({ viewport: { width, height: 1000 } })).newPage()
  await page.goto(`${MAIN}${PAGE}?t=${Date.now()}`, { waitUntil: 'load', timeout: 180000 })
  await page.waitForTimeout(1500)
  const facts = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body
    const text = (el) => (el ? el.innerText : '').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 3)
    return {
      lines: text(main),
      bodyLines: text(document.body),
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      canonical: document.querySelector('link[rel="canonical"]')?.href || '',
      h1: document.querySelector('h1')?.innerText.trim() || '',
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }
  })
  const file = path.join(OUT, `${label}-${width}.png`) // the first screen, compared pixel by pixel
  await page.screenshot({ path: file })
  await page.screenshot({ path: path.join(OUT, `${label}-${width}-full.png`), fullPage: true })
  await page.context().close()
  return { ...facts, file }
}

cli('option', 'update', 'local_approval_on', '1')
const { browser } = await launch()
await login(browser, ADMIN, process.env.WP_ADMIN_PASS)
let batch = ''
let liveId = 0
try {
  // 0. The original Main page.
  const original = await get(PAGE)
  check('M0 the original Main page answers and is Main\'s own (not drawn by WordPress)', original.status === 200 && !isBridged(original.html), String(original.status))
  const before = { desktop: await capture(browser, 'before', 1440), phone: await capture(browser, 'before', 390) }

  // 1–2. Import under approval: nothing changes on Main.
  const imported = json(act('import-bundle', ADMIN, '/tmp/bundle.json'))
  batch = imported.batch || ''
  const lines = (imported.lines || []).join('\n')
  check('M1 the import finishes; the page and the header/footer templates wait for approval', /record page page-main-[\w-]+: created .*waiting for approval/.test(lines) && /finished: imported pages are waiting in Approvals/.test(lines), (lines.match(/record page[^\n]*/) || [''])[0])
  liveId = Number((json(act('by-source', (lines.match(/record page (page-main-[\w-]+)/) || [])[1] || 'none')) || [])[0] || 0)
  const waiting = await get(PAGE)
  check('M2 while waiting for approval, Main still shows its own page', waiting.status === 200 && !isBridged(waiting.html))
  const compat = json(act('compat', liveId))
  // The converter keeps Main's exact styling as element custom CSS, which the registry flags for a
  // reviewer's look ("review"). Nothing may be blocked or need a code review.
  const flagged = (compat.items || []).filter((i) => i.status !== 'ok')
  check('M2 the converted design uses only widgets both websites can show (nothing blocked, no typed code)', ['ok', 'review'].includes(compat.status) && flagged.every((i) => i.status === 'review') && !(compat.items || []).some((i) => ['blocked', 'code'].includes(i.status)), `${compat.status}; widgets ${[...new Set((compat.items || []).map((i) => i.widget))].join(', ')}; flagged for review: ${(compat.features || []).join(', ') || 'none'}`)

  // 3. Approved and published over the Main address.
  check('M3 a reviewer approves exactly the imported revision', act('review', ADMIN, liveId, 'approve') === 'approved')
  act('publish', ADMIN, liveId)
  const pub = await settle(liveId)
  const moved = await get(PAGE)
  check('M3 published and verified: Main now serves the Elementor page at the same address', pub.outcome === 'verified' && moved.status === 200 && isBridged(moved.html), `${pub.outcome} ${JSON.stringify(pub.destinations || {})}`)

  // 4. Same content, same SEO, close visuals.
  const after = { desktop: await capture(browser, 'after', 1440), phone: await capture(browser, 'after', 390) }
  const kept = before.desktop.lines.filter((l) => after.desktop.bodyLines.some((m) => m.includes(l)))
  const ratio = kept.length / Math.max(1, before.desktop.lines.length)
  check('M4 every line of the original page\'s content is on the migrated page', ratio === 1, `${kept.length}/${before.desktop.lines.length} lines${ratio < 1 ? '; missing: ' + before.desktop.lines.filter((l) => !kept.includes(l)).slice(0, 3).join(' | ') : ''}`)
  check('M4 same main heading', before.desktop.h1 === after.desktop.h1, `${before.desktop.h1} | ${after.desktop.h1}`)
  check('M4 same title, description and canonical address', before.desktop.title === after.desktop.title && before.desktop.description === after.desktop.description && before.desktop.canonical === after.desktop.canonical, JSON.stringify({ title: [before.desktop.title, after.desktop.title], canonical: [before.desktop.canonical, after.desktop.canonical] }))
  check('M4 no sideways scrolling on a phone', !after.phone.overflow)
  for (const width of ['desktop', 'phone']) {
    const d = await diffRatio(before[width].file, after[width].file).catch((e) => ({ ratio: null, size: e.message }))
    console.log(`INFO M4 visual difference (${width}): ${d.ratio === null ? d.size : `${(d.ratio * 100).toFixed(2)}% of pixels`}; screenshots in ${OUT}`)
  }

  // 5. Taken off line by a reviewer: Main serves its own page again.
  check('M5 a reviewer takes the page off line', act('unpublish', ADMIN, liveId) === 'draft')
  const offAt = Date.now()
  let back = await get(PAGE)
  for (let i = 0; i < 18 && isBridged(back.html); i++) { cron(); await sleep(5000); back = await get(PAGE) }
  console.log(`INFO M5 Main showed its own page again after ${Math.round((Date.now() - offAt) / 1000)} s (removal job, then Main's 30 s address cache)`)
  const meta = (key) => { try { return cli('post', 'meta', 'get', liveId, key) } catch { return '' } }
  const mainState = () => `${meta('_acv_main_state')} ${meta('_acv_main_error')}`.trim()
  check('M5 Main serves its own original page again', back.status === 200 && !isBridged(back.html), `Main state of the page: ${mainState() || '(none)'}`)
} catch (error) {
  check('run finished without an unexpected error', false, String(error.message || error).split('\n')[0])
} finally {
  // 6. Undo the import: everything it created goes (page, templates, menu, archives).
  const undone = batch ? Number(act('undo-import', ADMIN, batch)) : 0
  cli('option', 'delete', 'local_approval_on')
  for (let i = 0; i < 2; i++) cron()
  let final = await get(PAGE)
  for (let i = 0; i < 12 && isBridged(final.html); i++) { cron(); await sleep(5000); final = await get(PAGE) }
  let copiesLeft = '?'
  try { copiesLeft = cli('post', 'list', '--post_type=elementor-hf,elementor_library,page', '--post_status=any', '--meta_key=_acv_copy_of', '--format=count') } catch {}
  check('Z undo import removes what it created (page and the template working copies it made); Main shows its own page', undone >= 3 && copiesLeft === '0' && final.status === 200 && !isBridged(final.html), `${undone} removed; working copies left: ${copiesLeft}`)
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed [LOCAL] | ${PAGE}`)
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
  await browser.close()
}
