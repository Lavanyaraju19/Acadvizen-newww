#!/usr/bin/env node
/**
 * Moves the Main Website's pages into the Enrollment WordPress (Master Admin), one family at a time, on
 * production, through the admin screens a reviewer uses: Import Main Website, then Approvals. Restartable;
 * every step writes its checkpoint to dist/main-migration/<family>/.
 *
 *   node tools/release/migrate-main.mjs plan    --family <name> [--attempt n]  offline: the family's bundle
 *   node tools/release/migrate-main.mjs import  --family <name> [--session f]  upload + run the import
 *   node tools/release/migrate-main.mjs preview-verify --family <name>         before publishing: each preview vs Main (browser)
 *   node tools/release/migrate-main.mjs publish --family <name> [--session f]  approve + publish what it created
 *   node tools/release/migrate-main.mjs verify  --family <name>                every address against Main's own page
 *   node tools/release/migrate-main.mjs undo    --family <name> [--session f]  "Undo this import" (latest import only)
 *
 * Families (dependency order): shell, blogs, tools, areas, cities, course, pages.
 *   shell  : the Main header, footer and location design as exported now (they are live: they come in as working
 *            copies, so nothing changes until they are approved), Main menu, Main CSS.
 *   blogs  : acv_blog records + blog design/card + blog categories.   tools: acv_tool + tool design/card.
 *   areas  : area and city-course pages (acv_location area-*) + their designs.
 *   cities : the remaining acv_location records not yet drawn by WordPress (the "-in-" city pages).
 *   course : acv_course.   pages: page records (homepage, dedicated pages, lists) + their cards and popup.
 *
 * Safety rules built in:
 *   - the Elementor kit (site-wide globals) is never imported: the Main colour/font values are written into the
 *     designs themselves (tools/main-to-elementor/inline-globals.mjs; same rendering). Importing them would
 *     change every approval fingerprint, so every waiting submission (also other people's) would go stale;
 *   - a record whose Main address WordPress already draws is left out (no stale overwrite of a live page);
 *     templates that are already live are only in "shell";
 *   - import refuses a batch already imported; publish acts only on the IDs this family's import created and
 *     never on rows that were in the queue before (e.g. other people's submissions);
 *   - verify compares every address with Main's own page (?acv-main=1): status, title, canonical, robots, H1,
 *     visible text (>= 97 % of Main's lines), Main header/footer present, no Enrollment template.
 * Prints no secret or cookie. Uses the owner's saved wp-admin session (~/acadvizen-release/wp-session.json or --session).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { inlineBundleGlobals } from '../main-to-elementor/inline-globals.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..')
const [cmd, ...rest] = process.argv.slice(2)
const args = Object.fromEntries(rest.reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []))
const FAMILY = String(args.family || '')
const FAMILIES = ['shell', 'blogs', 'tools', 'areas', 'cities', 'course', 'pages']
const WP = 'https://enroll.acadvizen.com', MAIN = 'https://www.acadvizen.com'
const SOURCE = path.join(ROOT, String(args.bundle || 'dist/main-rc-20261021/bundle-rc2.json'))
const DIR = path.join(ROOT, 'dist', 'main-migration', FAMILY)
const ts = () => new Date().toISOString().slice(11, 19) + 'Z'
const log = (m) => { const line = `[${ts()}] ${m}`; console.log(line); fs.mkdirSync(DIR, { recursive: true }); fs.appendFileSync(path.join(DIR, 'log.txt'), line + '\n') }
const stop = (m) => { log(`STOP: ${m}`); process.exit(1) }
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
if (!FAMILIES.includes(FAMILY)) { console.log(`--family must be one of: ${FAMILIES.join(', ')}`); process.exit(2) }

const LIVE_TEMPLATES = ['main-header', 'main-footer', 'design-location']
const FAMILY_TEMPLATES = {
  shell: LIVE_TEMPLATES,
  blogs: ['design-blog', 'card-blog'],
  tools: ['design-tool', 'card-tool'],
  areas: ['design-area', 'design-area-nearby-card', 'design-city-course'],
  cities: [],
  course: [],
  pages: ['card-blog-home', 'card-tool-list', 'popup-home-registration'],
}
const inFamily = (r) => ({
  shell: false,
  blogs: r.post_type === 'acv_blog',
  tools: r.post_type === 'acv_tool',
  areas: r.post_type === 'acv_location' && r.key.startsWith('area-'),
  cities: r.post_type === 'acv_location' && !r.key.startsWith('area-'),
  course: r.post_type === 'acv_course',
  pages: r.post_type === 'page',
})[FAMILY]

/** Is this Main address already drawn by WordPress (render version header)? */
async function drawnByWordPress(p) {
  for (let i = 1; ; i++) {
    try { const r = await fetch(MAIN + p, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(60000) }); await r.arrayBuffer(); return Boolean(r.headers.get('x-acadvizen-render-version')) } catch (e) { if (i >= 3) throw e }
  }
}

async function plan() {
  const src = readJson(SOURCE)
  const sha = crypto.createHash('sha256').update(fs.readFileSync(SOURCE)).digest('hex')
  const records = []
  const skipped = []
  const addressOf = (r) => (r.homepage ? '/' : r.main_path || '') // the homepage record has no main_path, only homepage: true
  for (const r of src.records.filter(inFamily)) {
    const p = addressOf(r)
    if (p && r.status !== 'draft' && await drawnByWordPress(p)) { skipped.push({ key: r.key, path: p, why: 'already drawn by WordPress' }); continue }
    records.push(r)
  }
  const templates = src.templates.filter((t) => FAMILY_TEMPLATES[FAMILY].includes(t.key))
  const body = JSON.stringify([records, templates])
  const mediaKeys = new Set([...body.matchAll(/acv-media(?:-id)?:\/\/([a-z0-9]+)/g)].map((m) => m[1]).concat(records.map((r) => r.featured_media).filter(Boolean)))
  // Templates these records draw with must already be on production or in this batch.
  const refs = new Set([...body.matchAll(/acv-template:\/\/([a-z0-9-]+)/g)].map((m) => m[1]))
  const earlier = FAMILIES.slice(0, FAMILIES.indexOf(FAMILY)).flatMap((f) => FAMILY_TEMPLATES[f])
  const unmet = [...refs].filter((k) => !FAMILY_TEMPLATES[FAMILY].includes(k) && !earlier.includes(k))
  const types = { blogs: ['acv_blog'], tools: ['acv_tool'] }[FAMILY] || []
  const settings = {
    ...(FAMILY === 'shell' || FAMILY === 'blogs' ? { main_css: src.settings.main_css } : {}),
    design_templates: Object.fromEntries(Object.entries(src.settings.design_templates || {}).filter(([t]) => types.includes(t) || (FAMILY === 'shell' && t === 'acv_location'))),
  }
  const bundle = {
    format: src.format, version: src.version,
    // --attempt 2 (after an undone first attempt): its own batch, so it is imported and undone on its own.
    batch: `main-${FAMILY}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${args.attempt ? `-a${Number(args.attempt)}` : ''}`,
    name: `Main Website: ${FAMILY} (from ${src.batch})`,
    source: src.source, generated_at: new Date().toISOString(),
    media: src.media.filter((m) => mediaKeys.has(m.key)),
    terms: FAMILY === 'blogs' ? src.terms : [],
    menus: FAMILY === 'shell' ? src.menus : [],
    kit: src.kit,
    templates: JSON.parse(JSON.stringify(templates)), settings, records: JSON.parse(JSON.stringify(records)),
    notes: [`family ${FAMILY} of ${src.batch} (sha256 ${sha.slice(0, 16)}…)`],
  }
  const inlined = inlineBundleGlobals(bundle) // empties bundle.kit
  const leftover = (JSON.stringify([bundle.records, bundle.templates]).match(/globals\/(?:colors|typography)\?id=/g) || []).length
  bundle.notes.push(`Main colours/fonts written into the designs: ${inlined.colors} colours, ${inlined.typography} typography; kit not imported; references left: ${leftover}`)
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(path.join(DIR, 'bundle.json'), JSON.stringify(bundle))
  const p = { family: FAMILY, batch: bundle.batch, source: path.relative(ROOT, SOURCE), source_sha256: sha, records: records.map((r) => ({ key: r.key, type: r.post_type, path: addressOf(r), status: r.status || 'publish' })), skipped, templates: templates.map((t) => t.key), media: bundle.media.length, kit: 'not imported', inlined, global_refs_left: leftover, unmet_template_refs: unmet }
  fs.writeFileSync(path.join(DIR, 'plan.json'), JSON.stringify(p, null, 1))
  log(`plan ${bundle.batch}: ${records.length} records (${records.filter((r) => r.status === 'draft').length} drafts), ${skipped.length} left out (already drawn by WordPress), templates ${p.templates.join(',') || '-'}, media ${bundle.media.length}, kit not imported (inlined ${inlined.colors} colours / ${inlined.typography} fonts, ${leftover} references left)${unmet.length ? `, needs templates from other families: ${unmet.join(',')}` : ''}`)
}

/* Browser steps ------------------------------------------------------------------------------------- */

async function browser() {
  const { chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright')
  const SESSION = String(args.session || path.join(os.homedir(), 'acadvizen-release', 'wp-session.json'))
  if (!fs.existsSync(SESSION)) stop(`no saved wp-admin session at ${SESSION}`)
  const b = await chromium.launch()
  const ctx = await b.newContext({ storageState: SESSION, viewport: { width: 1440, height: 1000 } })
  const p = await ctx.newPage(); p.on('dialog', (d) => d.accept())
  p.open = async (url) => { for (let i = 1; ; i++) { try { const r = await p.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' }); if (/wp-login\.php/.test(p.url())) stop('the saved wp-admin session has expired'); return r } catch (e) { if (i >= 4) throw e; log(`slow page, retry ${i}`); await p.waitForTimeout(20000 * i) } } }
  return { b, p }
}
const queueIds = (p) => p.$$eval('[id^="acv-candidate-"]', (rs) => rs.map((r) => ({ id: Number(r.id.replace('acv-candidate-', '')), state: r.getAttribute('data-state'), stale: r.getAttribute('data-stale') })))

async function runImport() {
  const bundleFile = path.join(DIR, 'bundle.json'), plan = readJson(path.join(DIR, 'plan.json'))
  if (fs.existsSync(path.join(DIR, 'import-ids.json'))) stop(`${plan.batch} was already imported (import-ids.json exists)`)
  const { b, p } = await browser()
  await p.open(`${WP}/wp-admin/admin.php?page=acadvizen-cms-settings`)
  const settings = (await p.locator('#wpbody-content').innerText()).replace(/\s+/g, ' ')
  const version = (settings.match(/Plugin version ([0-9.]+)/) || [])[1]
  const atLeast = (v, min) => { const [a, c] = [v, min].map((x) => String(x || '0').split('.').map(Number)); for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== (c[i] || 0)) return (a[i] || 0) > (c[i] || 0) } return true }
  if (!atLeast(version, '0.7.6') || !/APPROVAL on/.test(settings) || !/RENDER_BRIDGE on/.test(settings)) stop(`not the expected production state (plugin ${version}; APPROVAL/RENDER_BRIDGE must be on)`)
  await p.open(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  const before = await queueIds(p)
  fs.writeFileSync(path.join(DIR, 'queue-before.json'), JSON.stringify(before))
  log(`pre-checks: plugin ${version}, approval on, bridge on; Approvals queue before: ${before.map((r) => `${r.id}:${r.state}`).join(', ') || 'empty'}`)
  await p.open(`${WP}/wp-admin/admin.php?page=acadvizen-cms-import`)
  const logBefore = await p.locator('#acv-import-log').innerText().catch(() => '')
  if (logBefore.includes(`bundle uploaded: ${plan.batch}`)) stop(`${plan.batch} appears in the import log already: not importing again`)
  await p.setInputFiles('input[name="acv_bundle"]', bundleFile)
  await Promise.all([p.waitForNavigation({ timeout: 300000 }), p.locator('form[enctype="multipart/form-data"] input[type="submit"]').click()])
  log(`uploaded: ${(await p.locator('#acv-import-status').innerText().catch(() => '')).trim().slice(0, 160)}`)
  const T0 = new Date().toISOString()
  await p.evaluate(() => document.getElementById('acv-import-start').click())
  let status = ''
  for (const t0 = Date.now(); Date.now() - t0 < 60 * 60000;) { await p.waitForTimeout(5000); status = (await p.locator('#acv-import-status').innerText().catch(() => '')).trim(); if (/Finished\./.test(status)) break }
  const full = await p.locator('#acv-import-log').innerText()
  const mine = full.split('\n').slice(full.split('\n').findIndex((l) => l.includes(`bundle uploaded: ${plan.batch}`)))
  fs.writeFileSync(path.join(DIR, 'import-log.txt'), mine.join('\n'))
  const ids = {
    batch: plan.batch, start: T0, end: new Date().toISOString(), status,
    templates: [...mine.join('\n').matchAll(/template ([a-z0-9-]+): (?:created|updated)[^#\n]*#(\d+)/g)].map((m) => ({ key: m[1], id: Number(m[2]) })),
    // The homepage record has no address in its log line ("created (#11208)"): its address comes from the plan ("/").
    records: [...mine.join('\n').matchAll(/record [a-z_]+ ([a-z0-9-]+): (?:created|updated) \(#(\d+)(?: -> ([^)]+))?\)/g)].map((m) => ({ key: m[1], id: Number(m[2]), path: m[3] || plan.records.find((r) => r.key === m[1])?.path || '' })),
    // A record the bundle keeps as a draft is imported as "draft, not submitted" on purpose: not a problem.
    problems: mine.filter((l) => /error|failed|could not|not submitted/i.test(l) && !/[;:] draft, not submitted$/.test(l.replace(/\s+$/, ''))),
  }
  fs.writeFileSync(path.join(DIR, 'import-ids.json'), JSON.stringify(ids, null, 1))
  log(`import ${status.slice(0, 80)} | templates ${ids.templates.length}, records ${ids.records.length}, problems ${ids.problems.length}`)
  ids.problems.slice(0, 10).forEach((l) => log(`  ! ${l.slice(0, 200)}`))
  await b.close()
  if (!/Finished\./.test(status) || ids.problems.length) process.exit(1)
}

async function publish() {
  const ids = readJson(path.join(DIR, 'import-ids.json'))
  const protectedIds = new Set(readJson(path.join(DIR, 'queue-before.json')).map((r) => r.id))
  const resultsPath = path.join(DIR, 'publish-results.json')
  const results = fs.existsSync(resultsPath) ? readJson(resultsPath) : {}
  const { b, p } = await browser()
  const flash = async () => ((await p.locator('.acv-cms-approval-flash').count()) ? await p.locator('.acv-cms-approval-flash').first().innerText() : '').replace(/\s+/g, ' ').trim().slice(0, 160)
  // Designs first (pages are drawn with them), then records.
  // Only the IDs this import reported (its log names every item it created, working copies included). Never infer
  // "new" rows from the queue: other people submit items at any time (22 Oct 2026: the team resubmitted #8517 repeatedly).
  // Records the bundle keeps as drafts (e.g. the 11 unpublished blogs) are imported as drafts and never submitted:
  // they are left alone here.
  const drafts = new Set(readJson(path.join(DIR, 'plan.json')).records.filter((r) => r.status === 'draft').map((r) => r.key))
  const order = [...ids.templates.map((t) => ({ ...t, kind: 'design' })), ...ids.records.filter((r) => !drafts.has(r.key)).map((r) => ({ ...r, kind: 'record' }))]
  if (drafts.size) log(`${drafts.size} draft records left as drafts (not submitted, not published)`)
  async function act(id, selector) {
    await p.open(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
    const row = p.locator(`#acv-candidate-${id}`)
    if (!(await row.count())) return { missing: true }
    const state = await row.getAttribute('data-state')
    if (await row.getAttribute('data-stale') === '1') return { stale: state }
    if (selector === '.acv-approve' && state !== 'pending') return { skipped: state }
    if (selector === '.acv-approve') await row.evaluate((el) => el.querySelectorAll('.acv-preview-check, input[name="code_ok"]').forEach((c) => { c.checked = true }))
    if (selector === '.acv-approve' && await row.locator('textarea[name="note"]').count()) await row.locator('textarea[name="note"]').fill(`Main Website migration ${ids.batch} (owner-approved)`)
    if (!(await row.locator(selector).count())) return { noButton: state }
    await Promise.all([p.waitForNavigation({ timeout: 300000 }), row.locator(selector).first().dispatchEvent('click')])
    return { message: await flash() }
  }
  for (let pass = 1; pass <= 6; pass++) {
    let progress = 0, waiting = 0
    for (const item of order) {
      if (protectedIds.has(item.id) || results[item.id]?.published) continue
      // A slow admin page (timeout) is retried in the next pass instead of ending the run; an item published just
      // before the timeout is then no longer listed and is confirmed by verify (23 Oct 2026).
      const safe = async (sel) => { try { return await act(item.id, sel) } catch (e) { log(`#${item.id} ${sel}: ${String(e.message).split('\n')[0].slice(0, 120)} (retried in the next pass)`); return { error: true } } }
      const a = await safe('.acv-approve')
      if (a.missing || a.error) { waiting++; continue }
      const pub = await safe('.acv-publish')
      if (pub.error) { waiting++; continue }
      const published = /Publishing the approved revision/.test(pub.message || '')
      results[item.id] = { ...item, approve: a, publish: pub, published, at: new Date().toISOString() }
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 1))
      if (published) progress++
      log(`#${item.id} ${item.kind} ${item.path || item.key}: ${published ? 'approved + published' : `NOT published ${JSON.stringify({ a, pub }).slice(0, 200)}`}`)
    }
    log(`pass ${pass}: ${progress} published, ${waiting} not listed yet`)
    if (!waiting || !progress) break
  }
  await p.open(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  const after = await queueIds(p)
  const untouched = [...protectedIds].every((id) => after.some((r) => r.id === id))
  const done = order.filter((i) => results[i.id]?.published).length
  log(`published ${done} of ${order.length}; rows that were in the queue before (not ours, never touched) still listed: ${untouched ? 'yes' : 'no (changed by their owners)'}; queue now: ${after.map((r) => `${r.id}:${r.state}${r.stale === '1' ? ' (stale)' : ''}`).join(', ') || 'empty'}`)
  await b.close()
  // Other people's rows may legitimately change meanwhile (their own approvals or edits): reported above, never acted on.
  if (done !== order.length) process.exit(1)
}

/* Verification -------------------------------------------------------------------------------------- */

// Character references decoded the same way a browser shows them: WordPress writes "&#038;" and "&#039;" where Main
// writes "&amp;" and "'" (22 Oct 2026: 11 blogs differed only in that).
const dec = (s) => String(s || '').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const pick = (h, re) => dec((h.match(re) || [])[1] || '')
function facts(html) {
  const body = html.replace(/<head[\s\S]*?<\/head>/i, ' ')
  // Split into lines first, then tidy each line (tidying first collapsed the whole page into one line, 22 Oct 2026).
  const raw = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<title[\s\S]*?<\/title>/gi, '\n').replace(/<\/(p|div|h[1-6]|li|a|span|section|button|td|th|label)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
  const lines = [...new Set(raw.split('\n').map((l) => dec(l)))].filter((l) => l.length > 3)
  return {
    title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    canonical: pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
    robots: pick(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i),
    h1: pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, ''),
    ids: [...html.matchAll(/data-elementor-id="(\d+)"/g)].map((m) => m[1]),
    lines,
  }
}
async function get(url) { for (let i = 1; ; i++) { try { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 acadvizen-migration-check' }, signal: AbortSignal.timeout(90000) }); return { status: r.status, version: r.headers.get('x-acadvizen-render-version') || '', html: await r.text() } } catch (e) { if (i >= 4) return { status: 0, version: '', html: '' }; await new Promise((ok) => setTimeout(ok, 3000 * i)) } } }

let h1Browser = null
/** The first <h1> a visitor sees on a page, read in a real browser (after its scripts ran). */
async function renderedH1(url) {
  if (!h1Browser) {
    const { chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright')
    h1Browser = await chromium.launch()
    h1Browser.pageForH1 = await h1Browser.newPage()
    // Trackers by host only (a page address such as /tools/google-analytics must still load, 22 Oct 2026).
    await h1Browser.pageForH1.route((u) => /(^|\.)(google-analytics\.com|googletagmanager\.com|doubleclick\.net|clarity\.ms|facebook\.(com|net)|hotjar\.com|googleadservices\.com)$/.test(u.hostname) || (u.hostname === 'www.google.com' && /^\/(ccm|rmkt|pagead)/.test(u.pathname)), (rt) => rt.abort())
  }
  const p = h1Browser.pageForH1
  await p.goto(url, { waitUntil: 'load', timeout: 120000 }).catch(() => {})
  await p.waitForSelector('h1', { timeout: 15000 }).catch(() => {})
  return dec(await p.evaluate(() => document.querySelector('h1')?.textContent || '').catch(() => ''))
}

async function verify() {
  const plan = readJson(path.join(DIR, 'plan.json'))
  // The shell has no records of its own: it changes the header, footer and location design of every page WordPress
  // already draws, so those addresses (the cities plan's "left out" list) are the ones to check.
  const targets = FAMILY === 'shell'
    ? readJson(path.join(ROOT, 'dist', 'main-migration', 'cities', 'plan.json')).skipped.map((x) => ({ key: x.key, path: x.path, status: 'publish' }))
    : plan.records.filter((x) => x.path && x.status !== 'draft')
  if (!targets.length) stop('nothing to verify')
  const rows = []
  for (const r of targets) {
    const live = await get(`${MAIN}${r.path}`), own = await get(`${MAIN}${r.path}?acv-main=1`)
    const L = facts(live.html), O = facts(own.html)
    const lineSet = L.lines.join('\n'), joined = L.lines.join('')
    const coverage = O.lines.length ? O.lines.filter((l) => lineSet.includes(l) || joined.includes(l)).length / O.lines.length : 1
    const bad = []
    if (live.status !== 200) bad.push(`status ${live.status}`)
    if (!live.version) bad.push('not drawn by WordPress')
    for (const k of ['title', 'canonical', 'robots']) if (L[k] !== O[k]) bad.push(`${k}: ${JSON.stringify(O[k]).slice(0, 60)} -> ${JSON.stringify(L[k]).slice(0, 60)}`)
    // Some Main pages (e.g. tools) add their <h1> in the browser, after the page loads: then the H1 a visitor sees
    // on Main's own page (read in a real browser) must equal the WordPress page's H1 (22 Oct 2026: 66 tool pages).
    const mainH1 = O.h1 || (L.h1 ? await renderedH1(`${MAIN}${r.path}?acv-main=1`) : '')
    if (L.h1 !== mainH1) bad.push(`h1: ${JSON.stringify(mainH1).slice(0, 60)}${O.h1 ? '' : ' (in a browser)'} -> ${JSON.stringify(L.h1).slice(0, 60)}`)
    if (coverage < 0.97) bad.push(`text ${Math.round(coverage * 1000) / 10}% of Main's lines`)
    if (!(L.ids.includes('8798') && L.ids.includes('8799'))) bad.push('Main header/footer missing')
    if (L.ids.some((i) => ['960', '1035', '1799', '6147'].includes(i))) bad.push('Enrollment template present')
    rows.push({ path: r.path, key: r.key, ok: !bad.length, coverage: Math.round(coverage * 1000) / 1000, bad })
    if (bad.length) log(`FAIL ${r.path}: ${bad.join(' | ')}`)
  }
  if (h1Browser) await h1Browser.close()
  fs.writeFileSync(path.join(DIR, 'verify.json'), JSON.stringify({ at: new Date().toISOString(), family: FAMILY, rows }, null, 1))
  const ok = rows.filter((r) => r.ok).length
  log(`verify ${FAMILY}: ${ok} of ${rows.length} addresses pass (status, WordPress-drawn, title, canonical, robots, H1, text >= 97 %, Main chrome only)`)
  if (ok !== rows.length) process.exit(1)
}

/**
 * Before anything is published: each imported record's "As on the Main website" preview (Approvals; signed in)
 * against Main's own page, both read in a real browser, so only what a visitor sees is compared (blocks hidden on
 * Main, e.g. display:none, do not count; headings added by scripts do). Checks the title, the first <h1> and that
 * >= 97 % of Main's visible lines are on the preview. 23 Oct 2026: the server-HTML check had counted a section hidden
 * on Main at every width as missing from the homepage.
 */
async function previewVerify() {
  const ids = readJson(path.join(DIR, 'import-ids.json'))
  const plan = readJson(path.join(DIR, 'plan.json'))
  const drafts = new Set(plan.records.filter((r) => r.status === 'draft').map((r) => r.key))
  const { b, p } = await browser()
  await p.open(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`)
  const links = await p.$$eval('[id^="acv-candidate-"]', (rows) => Object.fromEntries(rows.map((r) => [r.id.replace('acv-candidate-', ''), [...r.querySelectorAll('a')].find((a) => /As on the Main website/.test(a.textContent))?.href || ''])))
  const page = await p.context().newPage()
  await page.route((u) => /(^|\.)(google-analytics\.com|googletagmanager\.com|doubleclick\.net|clarity\.ms|facebook\.(com|net)|hotjar\.com|googleadservices\.com)$/.test(u.hostname), (rt) => rt.abort())
  const read = async (url) => {
    await page.goto(url, { waitUntil: 'load', timeout: 180000 }).catch(() => {})
    await page.waitForTimeout(2500)
    // The Approvals preview shows the render inside a sandboxed iframe (admin-site.php print_sandboxed_preview):
    // read that frame, not the notice around it.
    const frame = /acv_cms_preview_main/.test(url) ? page.frames().find((f) => f !== page.mainFrame()) || page.mainFrame() : page.mainFrame()
    await frame.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } window.scrollTo(0, 0) }).catch(() => {})
    return frame.evaluate(() => ({ title: document.title.trim(), h1: (document.querySelector('h1')?.innerText || '').trim(), lines: [...new Set(document.body.innerText.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 3))] })).catch(() => ({ title: '', h1: '', lines: [] }))
  }
  const rows = []
  for (const r of ids.records.filter((x) => !drafts.has(x.key))) {
    // --live: the published page on www (scripts run) instead of the Approvals preview (sandboxed, no scripts).
    const href = args.live ? `${MAIN}${r.path}` : links[String(r.id)]
    if (!href) { rows.push({ path: r.path, ok: false, bad: ['no preview link (not waiting in Approvals)'] }); log(`PREVIEW FAIL ${r.path}: no preview link`); continue }
    // GET, not HEAD: HEAD answers do not always carry the render header (23 Oct 2026).
    if (args.live) { const h = await fetch(href).catch(() => null); await h?.arrayBuffer().catch(() => {}); if (!h?.headers.get('x-acadvizen-render-version')) { rows.push({ path: r.path, ok: false, bad: ['not drawn by WordPress'] }); log(`LIVE FAIL ${r.path}: not drawn by WordPress`); continue } }
    const wpv = await read(href), own = await read(`${MAIN}${r.path}${r.path.includes('?') ? '&' : '?'}acv-main=1`)
    const hay = wpv.lines.join('\n'), joined = wpv.lines.join(' ')
    const missing = own.lines.filter((l) => !hay.includes(l) && !joined.includes(l))
    const coverage = own.lines.length ? (own.lines.length - missing.length) / own.lines.length : 1
    const bad = []
    if (wpv.h1 !== own.h1) bad.push(`h1: ${JSON.stringify(own.h1).slice(0, 60)} -> ${JSON.stringify(wpv.h1).slice(0, 60)}`)
    if (coverage < 0.97) bad.push(`visible text ${Math.round(coverage * 1000) / 10}% (missing e.g. ${JSON.stringify(missing.slice(0, 4).map((x) => x.slice(0, 50)))})`)
    rows.push({ path: r.path, ok: !bad.length, coverage: Math.round(coverage * 1000) / 1000, missing: missing.slice(0, 30), bad })
    log(`${bad.length ? 'PREVIEW FAIL' : 'preview ok'} ${r.path}: visible text ${Math.round(coverage * 1000) / 10}%${bad.length ? ' | ' + bad.join(' | ') : ''}`)
  }
  fs.writeFileSync(path.join(DIR, args.live ? 'live-visible-verify.json' : 'preview-verify.json'), JSON.stringify({ at: new Date().toISOString(), family: FAMILY, live: Boolean(args.live), rows }, null, 1))
  const ok = rows.filter((x) => x.ok).length
  log(`${args.live ? 'live visible-text verify' : 'preview-verify'} ${FAMILY}: ${ok} of ${rows.length} pass${args.live ? '' : ' (nothing published)'}`)
  await b.close()
  if (ok !== rows.length) process.exit(1)
}

async function undo() {
  const plan = readJson(path.join(DIR, 'plan.json'))
  const { b, p } = await browser()
  await p.open(`${WP}/wp-admin/admin.php?page=acadvizen-cms-import`)
  const status = (await p.locator('#acv-import-status').innerText().catch(() => '')).trim()
  // The status line names the current import's bundle ("Bundle <name>: N of N items processed"); the on-screen log
  // is cut short and may no longer show its "bundle uploaded" line (22 Oct 2026).
  const name = readJson(path.join(DIR, 'bundle.json')).name
  const last = status.startsWith(`Bundle ${name}:`) ? plan.batch : status.slice(0, 80)
  if (last !== plan.batch) stop(`the current import is "${last}", not ${plan.batch}: "Undo this import" would undo another batch. Use Approvals > Recent publications > Restore, or Quick Edit > Draft, for these items`)
  const btn = p.locator('form[onsubmit*="Delete everything this import created"] input[type="submit"], form[onsubmit*="Delete everything this import created"] button').first()
  if (!(await btn.count())) stop(`no "Undo this import" button (status: ${status.slice(0, 100)})`)
  await Promise.all([p.waitForNavigation({ timeout: 300000 }), btn.click()])
  log(`undo ${plan.batch}: ${(await p.locator('#acv-import-log').innerText().catch(() => '')).split('\n').filter((l) => /undo:/.test(l)).pop() || '(no undo line)'}`)
  await b.close()
}

const run = { plan, import: runImport, 'preview-verify': previewVerify, publish, verify, undo }[cmd]
if (!run) { console.log('usage: migrate-main.mjs plan|import|preview-verify|publish|verify|undo --family <name>'); process.exit(2) }
await run()
