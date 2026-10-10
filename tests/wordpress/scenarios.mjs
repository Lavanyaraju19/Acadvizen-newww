// Local acceptance scenarios for the Acadvizen Master Admin plugin and the Main Website integration,
// against the throwaway Docker WordPress of this folder (:8088) and a local production build of Main
// (:3100) with the integration on. Setup: tests/wordpress/README.md.
//   node tests/wordpress/scenarios.mjs            (all: L A B C D E F H)
//   node tests/wordpress/scenarios.mjs AF         (only some)
// L lifecycle, A Main only, B Enrollment only, C Both, D global redesign, E city/area page,
// F rollback, H failed render and retry. Disposable test content only; everything created is
// deleted at the end and the global colour restored.
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const COMPOSE_DIR = process.env.ACV_WP_COMPOSE_DIR || HERE
const MAIN = process.env.MAIN_URL || 'http://localhost:3100'
const WP = process.env.WP_URL || 'http://localhost:8088'
const T = Date.now().toString(36)
const only = process.argv[2] || 'LABCDEFH'
let pass = 0, fail = 0
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const compose = (args, opts = {}) => execFileSync('docker', ['compose', ...args], { cwd: COMPOSE_DIR, env: { ...process.env, MSYS_NO_PATHCONV: '1' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], ...opts }).trim()
const cli = (...args) => compose(['run', '--rm', '-T', 'cli', ...args.map(String)])
function wp(...args) {
  return compose(['run', '--rm', '-T', '-v', `${path.join(HERE, 'e2e-actions.php')}:/tmp/e2e.php:ro`, 'cli', 'eval-file', '/tmp/e2e.php', ...args.map(String)])
}
// Runs due jobs exactly as the production server cron (every minute) does; an idle local site gets
// no visits, so WordPress' visit-driven cron alone would leave jobs waiting.
const cron = () => { try { cli('cron', 'event', 'run', '--due-now') } catch {} }
async function get(base, path) {
  const r = await fetch(`${base}${path}${path.includes('?') ? '&' : '?'}t=${Date.now()}`, { redirect: 'manual' })
  const html = r.status === 200 ? await r.text() : ''
  return { status: r.status, html, version: Number(r.headers.get('x-acadvizen-render-version') || 0), location: r.headers.get('location') || '' }
}
async function until(fn, pred, timeoutMs = 180000) {
  const t0 = Date.now(); let last
  while (Date.now() - t0 < timeoutMs) { last = await fn(); if (pred(last)) return { ok: true, s: Math.round((Date.now() - t0) / 1000), last }; await cron(); await sleep(3000) }
  return { ok: false, s: Math.round((Date.now() - t0) / 1000), last }
}
const has = (r, text) => r.status === 200 && r.html.includes(text)
const created = []

try {
  if (only.includes('L')) {
    console.log('\n— L. Plugin lifecycle in WordPress —')
    const htaccess = () => compose(['exec', '-T', 'wordpress', 'sha256sum', '/var/www/html/.htaccess']).slice(0, 16)
    const jobs = () => cli('cron', 'event', 'list', '--fields=hook', '--format=csv').split(/\r?\n/).filter((h) => ['acv_cms_daily_refresh', 'acv_cms_requeue_stalled'].includes(h)).length
    const namespace = async () => ((await (await fetch(`${WP}/wp-json/`)).json()).namespaces || []).includes('acadvizen-cms/v1')
    const before = htaccess()
    cli('plugin', 'deactivate', 'acadvizen-cms')
    check('L deactivate: .htaccess unchanged', htaccess() === before)
    check('L deactivate: recurring jobs removed', jobs() === 0)
    check('L deactivate: API namespace gone', !(await namespace()))
    cli('plugin', 'activate', 'acadvizen-cms')
    check('L activate: .htaccess unchanged (rules rebuilt in the database only)', htaccess() === before)
    check('L activate: both recurring jobs scheduled', jobs() === 2)
    check('L activate: API namespace registered', await namespace())
    const state = cli('eval', String.raw`global $wpdb; echo $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}acv_render_versions'") ? "table" : "no-table", has_filter("login_headerurl") ? " login" : "", has_filter("hfe_get_settings_type_header") ? " hfe" : "", has_action("wp_loaded", 'Acadvizen\CMS\restore_missing_sitemap_rules') ? " sitemap" : "";`)
    check('L activate: versions table present', state.startsWith('table'), state)
    check('L optional features off by default (no login, header/footer or sitemap hooks)', state === 'table', state)
  }

  if (only.includes('A')) {
    console.log('\n— A. Main only (draft → layout/colour → preview → publish) —')
    const slug = `acv-e2e-main-${T}`, title = `E2E MAIN A1 ${T}`
    const id = wp('page', 'page', slug, title, 'main', 'draft', '#0a3d62'); created.push(id)
    check('A draft: not on Main', (await get(MAIN, `/${slug}`)).status === 404)
    check('A draft: not public on Enrollment', (await get(WP, `/?page_id=${id}`)).status === 404)
    wp('edit', id, `E2E MAIN A2 ${T}`, '#6a0dad', '1', 'draft')
    check('A preview of the redesigned draft (1 column, purple) renders before publishing', wp('preview', id, `E2E MAIN A2 ${T}`) === 'ok-shows')
    check('A preview stored nothing', wp('state', id).split('|')[1] === '-')
    wp('edit', id, `E2E MAIN A2 ${T}`, '#6a0dad', '1', 'publish')
    const live = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E MAIN A2 ${T}`))
    check('A published: served by Main with the new title', live.ok, `${live.s}s, version ${live.last.version}`)
    check('A published: Main shows the new background colour', /#6a0dad/i.test(live.last.html))
    check('A published: not on Enrollment (404)', (await get(WP, `/${slug}/`)).status === 404)
    check('A Main page is in the Main sitemap', (await until(() => get(MAIN, '/sitemap.xml'), (r) => r.html.includes(`/${slug}<`) || r.html.includes(`/${slug}`), 60000)).ok)
  }

  if (only.includes('B')) {
    console.log('\n— B. Enrollment only —')
    const slug = `acv-e2e-enroll-${T}`, title = `E2E ENROLL B ${T}`
    const id = wp('page', 'page', slug, title, 'enrollment', 'publish', '#145a32'); created.push(id)
    check('B Enrollment shows it', has(await get(WP, `/${slug}/`), title))
    await sleep(8000); await cron()
    check('B Main does not (404)', (await get(MAIN, `/${slug}`)).status === 404)
    check('B nothing stored for Main', wp('state', id).split('|')[1] === '-')
  }

  if (only.includes('C')) {
    console.log('\n— C. Both websites, then a shared change —')
    const slug = `acv-e2e-both-${T}`, title = `E2E BOTH C1 ${T}`
    const id = wp('page', 'page', slug, title, 'both', 'publish', '#7b241c'); created.push(id)
    check('C Enrollment shows it at once', has(await get(WP, `/${slug}/`), title))
    const m = await until(() => get(MAIN, `/${slug}`), (r) => has(r, title))
    check('C Main shows it', m.ok, `${m.s}s`)
    wp('edit', id, `E2E BOTH C2 ${T}`, '#1b4f72', '2')
    check('C change on Enrollment', has(await get(WP, `/${slug}/`), `E2E BOTH C2 ${T}`))
    const m2 = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E BOTH C2 ${T}`))
    check('C change on Main', m2.ok, `${m2.s}s`)
    wp('target', id, 'main')
    const gone = await until(() => get(WP, `/${slug}/`), (r) => r.status === 404, 30000)
    check('C switched to Main only: removed from Enrollment', gone.ok)
    check('C still on Main', has(await get(MAIN, `/${slug}`), `E2E BOTH C2 ${T}`))
  }

  if (only.includes('F')) {
    console.log('\n— F. Recovery: publish, change design, roll back —')
    const slug = `acv-e2e-rollback-${T}`
    const id = wp('page', 'page', slug, `E2E ROLLBACK V1 ${T}`, 'main', 'publish', '#117a65'); created.push(id)
    const v1 = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E ROLLBACK V1 ${T}`))
    check('F v1 live (green)', v1.ok && /#117a65/i.test(v1.last.html), `version ${v1.last.version}`)
    wp('edit', id, `E2E ROLLBACK V2 ${T}`, '#b03a2e', '1')
    const v2 = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E ROLLBACK V2 ${T}`))
    check('F v2 live (red, 1 column)', v2.ok && /#b03a2e/i.test(v2.last.html), `version ${v2.last.version}`)
    check('F roll back to v1', wp('rollback', id, v1.last.version) === 'rolled-back')
    const back = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E ROLLBACK V1 ${T}`), 60000)
    check('F v1 text and design (green) back on Main', back.ok && /#117a65/i.test(back.last.html) && !/#b03a2e/i.test(back.last.html), `${back.s}s`)
    wp('edit', id, `E2E ROLLBACK V3 ${T}`, '#2e4053', '2')
    const v3 = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E ROLLBACK V3 ${T}`))
    check('F the next update replaces the rollback', v3.ok)
  }

  if (only.includes('E')) {
    console.log('\n— E. City and area page —')
    const [cityId, areaId] = wp('city-area', `E2E City ${T}`, `E2E Area ${T}`).split(' ')
    created.push(`term:${areaId}`, `term:${cityId}`)
    check('E area is a child of the city', wp('term-info', areaId) === `E2E Area ${T} parent=E2E City ${T}`)
    const slug = `e2e-area-${T}`, title = `E2E AREA PAGE ${T}`
    const id = wp('page', 'acv_location', slug, title, 'main', 'draft', '#4a235a'); created.push(id)
    wp('assign-term', id, areaId)
    check('E preview of the area page before publishing', wp('preview', id, title) === 'ok-shows')
    wp('edit', id, title, '#4a235a', '2')
    const live = await until(() => get(MAIN, `/${slug}`), (r) => has(r, title))
    check('E area page served by Main at /<slug>', live.ok, `${live.s}s`)
    check('E Main-only location hidden on Enrollment', (await get(WP, `/location/${slug}/`)).status === 404)
    wp('slug', id, `${slug}-new`)
    const moved = await until(() => get(MAIN, `/${slug}-new`), (r) => has(r, title))
    check('E address change: new address served', moved.ok, `${moved.s}s`)
    const old = await until(() => get(MAIN, `/${slug}`), (r) => [301, 308].includes(r.status), 60000)
    check('E address change: old address redirects to the new one', old.ok && old.last.location.endsWith(`/${slug}-new`), `${old.last.status} → ${old.last.location}`)
  }

  if (only.includes('H')) {
    console.log('\n— H. Failure: a render fails, the live version stays, retry recovers —')
    const slug = `acv-e2e-fail-${T}`
    const id = wp('page', 'page', slug, `E2E FAIL OK1 ${T}`, 'main', 'publish', '#1c2833'); created.push(id)
    const ok1 = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E FAIL OK1 ${T}`))
    check('H first version live', ok1.ok)
    wp('fail', 'on')
    wp('edit', id, `E2E FAIL NEW ${T}`, '#1c2833', '2')
    const st = await until(async () => wp('state', id), (s) => s.split('|')[2] !== '', 90000)
    check('H failed render recorded, retry scheduled', st.ok, st.last)
    check('H Main keeps the previous version', has(await get(MAIN, `/${slug}`), `E2E FAIL OK1 ${T}`))
    wp('fail', 'off')
    wp('retry', id)
    const rec = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E FAIL NEW ${T}`))
    check('H retry publishes the new version', rec.ok, `${rec.s}s`)
    check('H error cleared after success', wp('state', id).split('|')[2] === '')
  }

  if (only.includes('D')) {
    console.log('\n— D. Global redesign: Elementor global primary colour —')
    const slug = `acv-e2e-global-${T}`
    const id = wp('page', 'page', slug, `E2E GLOBAL ${T}`, 'main', 'publish', '#ffffff'); created.push(id)
    const before = await until(() => get(MAIN, `/${slug}`), (r) => has(r, `E2E GLOBAL ${T}`))
    const original = wp('kit-primary')
    created.push(`kit:${original}`)
    wp('kit-primary', '#ff00aa')
    const after = await until(() => get(MAIN, `/${slug}`), (r) => /--e-global-color-primary:\s*#FF00AA/i.test(r.html), 600000)
    check('D global colour reached the Main page (site-wide re-render)', after.ok, `${after.s}s`)
    check('D page-specific background kept', /#ffffff/i.test(after.last.html) && after.last.html.includes(`E2E GLOBAL ${T}`))
    // Enrollment links Elementor's generated CSS (the kit file holds the global colours); Main inlines it.
    const home = (await get(WP, `/acv-e2e-global-${T}/`)).html || (await get(WP, '/')).html
    const cssLinks = [...home.matchAll(/href=['"]([^'"]+\/elementor\/css\/post-\d+\.css[^'"]*)/g)].map((m) => m[1].replace(/&#038;/g, '&'))
    let enrollHasColour = false
    for (const href of cssLinks) {
      const css = await fetch(href.replace(/^https?:\/\/[^/]+/, WP)).then((r) => r.text()).catch(() => '')
      if (/--e-global-color-primary:\s*#FF00AA/i.test(css)) enrollHasColour = true
    }
    check('D Enrollment uses the new global colour (Elementor kit stylesheet)', enrollHasColour, `${cssLinks.length} Elementor stylesheets checked`)
    void before
  }
} finally {
  console.log('\n— cleanup —')
  wp('fail', 'off')
  for (const item of created.reverse()) {
    if (String(item).startsWith('term:')) wp('delete-term', item.slice(5))
    else if (String(item).startsWith('kit:')) wp('kit-primary', item.slice(4))
    else wp('delete', item)
  }
  console.log(`removed ${created.length} test items`)
  console.log(`\n${pass} passed, ${fail} failed`)
}
