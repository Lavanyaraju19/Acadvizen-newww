// Live acceptance of "design in Elementor, publish to Main / Enrollment / Both" through the real WordPress
// admin and Elementor editor (Render Bridge on for Main, Publish To switch on in WordPress).
//
//   node tools/verify-elementor-live.mjs                 all three destinations, then the Both clash case
//   DESTINATION=main|enrollment|both node tools/verify-elementor-live.mjs
//
// For each destination, on ONE new, clearly labelled test page ("CMS ACCEPTANCE … <time>", noindex):
//   create draft → build a section in Elementor (heading, text, button with a link, an image from the
//   media library) and choose Publish To → Save Draft (not public anywhere) → Preview shows it →
//   Publish → the real public address(es) show it at 1440/768/390, the other site does not → edit and
//   Update → change is live → History → Revisions → Apply → Update → previous version live again →
//   Unpublish (Draft) → gone from the public addresses. The page is KEPT as an unpublished draft
//   (it is never deleted automatically).
// Then the partial-failure case on a Both blog: its address belongs to an existing Main blog, so Main
// refuses: the admin must see a red message naming that, no Enrollment copy may be created and the
// existing Main blog must be unchanged. Nothing is published in that case.
//
// Sign-in: WP_STORAGE_STATE (saved session) or WP_USER / WP_PASS. Addresses: WP_URL, MAIN_URL
// (default: the live sites). WORDPRESS_CMS_WEBHOOK_SECRET is needed for the clash case (read-only
// list of Main blogs). Screenshots: EVIDENCE_DIR. Prints no credential or cookie.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { signPayload } from '../lib/wordpress/signature.js'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = (process.env.WP_URL || 'https://enroll.acadvizen.com').replace(/\/$/, '')
const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const LIVE = /acadvizen\.com/.test(WP + MAIN)
const OUT = process.env.EVIDENCE_DIR || path.join(process.cwd(), 'elementor-live-evidence')
fs.mkdirSync(OUT, { recursive: true })
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const DESTS = (process.env.DESTINATION || 'main,enrollment,both').split(',')
const TRACKING = /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|facebook\.(com|net)|clarity\.ms|hotjar\.(com|io))$/i
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (name, ok, detail = '') => { results.push(Boolean(ok)); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const kept = []

async function get(url) {
  const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}acvcheck=${Date.now()}`, { redirect: 'manual', headers: { 'user-agent': 'acadvizen-acceptance (labelled test page)' } })
  return { status: r.status, html: r.status === 200 ? await r.text() : '', version: r.headers.get('x-acadvizen-render-version') || '' }
}
async function until(fn, pred, ms = 240000) {
  const t0 = Date.now(); let last
  while (Date.now() - t0 < ms) { last = await fn(); if (pred(last)) return { ok: true, s: Math.round((Date.now() - t0) / 1000), last }; await sleep(5000) }
  last = await fn(); return { ok: pred(last), s: Math.round((Date.now() - t0) / 1000), last }
}

const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-features=CalculateNativeWinOcclusion'] })
const ctxOpts = { viewport: { width: 1440, height: 1000 } }
const adminCtx = await browser.newContext(process.env.WP_STORAGE_STATE ? { ...ctxOpts, storageState: process.env.WP_STORAGE_STATE } : ctxOpts)
await adminCtx.route((u) => TRACKING.test(u.hostname), (r) => r.abort())
const admin = await adminCtx.newPage()
admin.on('dialog', (d) => d.accept())
if (!process.env.WP_STORAGE_STATE) {
  await admin.goto(`${WP}/wp-login.php`)
  await admin.fill('#user_login', process.env.WP_USER || ''); await admin.fill('#user_pass', process.env.WP_PASS || '')
  await admin.click('#wp-submit'); await admin.waitForURL(/wp-admin/, { timeout: 120000 })
}
await admin.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)
const nonce = (await admin.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in to wp-admin'); process.exit(2) }
const rest = async (method, route, data) => {
  const r = await adminCtx.request.fetch(`${WP}/wp-json/${route}`, { method, headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: data ? JSON.stringify(data) : undefined })
  return { status: r.status(), json: await r.json().catch(() => ({})) }
}
const media = (await rest('GET', 'wp/v2/media?media_type=image&per_page=1&orderby=date')).json[0]

async function openEditor(id) {
  await admin.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 180000 })
  await admin.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 180000 })
  await sleep(2000)
}
async function save(kind) {
  await admin.evaluate(async (k) => { await $e.run(k === 'publish' ? 'document/save/publish' : 'document/save/draft') }, kind)
  await admin.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(2000)
}
async function setHeading(text) {
  await admin.evaluate((t) => {
    const find = (c) => (c.model.get('widgetType') === 'heading' ? c : (c.children || []).map(find).find(Boolean))
    $e.run('document/elements/settings', { container: find(elementor.getPreviewContainer()), settings: { title: t } })
  }, text)
}
// Reads the test page's own content (its Elementor document), not the site header/footer around it.
async function visit(url, width, shot, docId) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  await ctx.route((u) => TRACKING.test(u.hostname), (r) => r.abort())
  const p = await ctx.newPage()
  const r = await p.goto(`${url}?acvcheck=${Date.now()}`, { waitUntil: 'load', timeout: 120000 }).catch(() => null)
  await sleep(1000)
  const info = await p.evaluate((id) => {
    const root = document.querySelector(`[data-elementor-id="${id}"]`) || document.body
    const h = root.querySelector('.elementor-widget-heading .elementor-heading-title')
    const img = root.querySelector('.elementor-widget-image img')
    const btn = root.querySelector('.elementor-widget-button a')
    const W = window.innerWidth
    return {
      scoped: root !== document.body,
      heading: h ? h.textContent.trim() : '', image: img ? img.naturalWidth > 0 : false, button: btn ? btn.getAttribute('href') : '',
      canonical: document.querySelector('link[rel="canonical"]')?.href || '', robots: document.querySelector('meta[name="robots"]')?.content || '',
      overflow: [...root.querySelectorAll('*')].some((e) => e.getBoundingClientRect().right > W + 1),
      pageOverflow: document.documentElement.scrollWidth > W + 1,
    }
  }, docId).catch(() => ({}))
  if (shot) await p.screenshot({ path: path.join(OUT, `${shot}-${width}.png`), fullPage: true }).catch(() => {})
  await ctx.close()
  return { status: r ? r.status() : 0, ...info }
}

async function journey(dest) {
  const label = `CMS ACCEPTANCE ${dest.toUpperCase()} ${T}`
  const slug = `cms-acceptance-${dest}-${T}`
  const mainUrl = `${MAIN}/${slug}`, enrollUrl = `${WP}/${slug}/`
  const onMain = dest !== 'enrollment', onEnroll = dest !== 'main'
  console.log(`\n— ${dest}: ${label} (Main ${mainUrl} | Enrollment ${enrollUrl}) —`)
  const created = await rest('POST', 'wp/v2/pages', { title: label, slug, status: 'draft', template: 'elementor_header_footer' })
  const id = created.json.id
  check(`${dest} 1 test page created as a draft`, created.status === 201 && id, `#${id}`)
  if (!id) return
  kept.push({ id, slug, dest })
  // Test pages are never indexed (Rank Math's own endpoint, as its editor sidebar saves it), so Instant
  // Indexing skips them and search engines are told not to list them while they are briefly public.
  const robots = await rest('POST', 'rankmath/v1/updateMeta', { objectType: 'post', objectID: id, meta: { rank_math_robots: ['noindex', 'nofollow'] } })
  check(`${dest} 1 test page set to noindex before publishing`, robots.status === 200, `HTTP ${robots.status}`)
  await openEditor(id)
  await admin.evaluate(({ v1, dest, img }) => {
    const doc = elementor.documents.getCurrent()
    $e.run('document/elements/settings', { container: doc.container, settings: { acv_publish_target: dest } })
    const box = $e.run('document/elements/create', { container: elementor.getPreviewContainer(), model: { elType: 'container', settings: { flex_direction: 'row', flex_direction_mobile: 'column', background_background: 'classic', background_color: '#0B1F3A', padding: { unit: 'px', top: '60', right: '24', bottom: '60', left: '24', isLinked: false } } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'heading', settings: { title: v1, header_size: 'h1', title_color: '#FFFFFF' } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'text-editor', settings: { editor: '<p style="color:#cbd5e1">Labelled acceptance test page. It is unpublished at the end of the test.</p>' } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'button', settings: { text: 'Enquire now', link: { url: '/contact', is_external: '', nofollow: '' } } } })
    if (img) $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'image', settings: { image: { id: img.id, url: img.url } } } })
  }, { v1: `${label} V1`, dest, img: media ? { id: media.id, url: media.source_url } : null })
  await save('draft')
  const dMain = await get(mainUrl), dEnroll = await get(enrollUrl)
  check(`${dest} 2 Save Draft: not public on Main or Enrollment`, dMain.status !== 200 && dEnroll.status !== 200, `Main ${dMain.status}, Enrollment ${dEnroll.status}`)
  const previewUrl = await admin.evaluate(() => elementor.documents.getCurrent().config.urls.wp_preview)
  const pv = await adminCtx.newPage(); await pv.goto(previewUrl, { waitUntil: 'load', timeout: 120000 })
  check(`${dest} 3 Preview (signed in) shows the draft`, (await pv.content()).includes(`${label} V1`)); await pv.close()

  await save('publish')
  const m1 = onMain ? await until(() => get(mainUrl), (r) => r.html.includes(`${label} V1`)) : null
  const e1 = await get(enrollUrl)
  if (onMain) check(`${dest} 4 Publish: live on Main`, m1.ok, `${m1.s}s, render version ${m1.last.version}`)
  else check(`${dest} 4 Publish: not on Main`, (await get(mainUrl)).status !== 200)
  if (onEnroll) check(`${dest} 4 Publish: live on Enrollment`, e1.html.includes(`${label} V1`), `HTTP ${e1.status}`)
  else check(`${dest} 4 Publish: not on Enrollment`, e1.status !== 200 || !e1.html.includes(`${label} V1`), `HTTP ${e1.status}`)
  for (const [site, url] of [['Main', onMain && mainUrl], ['Enrollment', onEnroll && enrollUrl]].filter(([, u]) => u)) {
    const views = []
    for (const w of [1440, 768, 390]) views.push(await visit(url, w, `${dest}-${site.toLowerCase()}-published`, id))
    const ok = views.every((v) => v.status === 200 && v.scoped && v.heading === `${label} V1` && !v.overflow && (!media || v.image) && /\/contact$/.test(v.button))
    check(`${dest} 5 ${site} page at 1440/768/390: heading, image, button link, content fits the window`, ok, views.map((v) => `${v.status} img:${v.image} btn:${v.button} fits:${!v.overflow}`).join(' | '))
    const wide = views.filter((v) => v.pageOverflow).length
    if (wide) console.log(`INFO ${dest} ${site}: the site's own header/footer scrolls sideways at ${wide} of 3 widths (pre-existing, not the test content)`)
    // Rank Math prints no canonical on a noindex page; when one is printed it must be the www address.
    if (site === 'Main') check(`${dest} 5 Main canonical is the www address (none on a noindex page)`, views[0].canonical === mainUrl || (!views[0].canonical && /noindex/i.test(views[0].robots)), views[0].canonical || 'none (noindex)')
    check(`${dest} 5 ${site} test page is noindex`, /noindex/i.test(views[0].robots), views[0].robots)
  }

  await openEditor(id); await setHeading(`${label} V2`); await save('publish')
  if (onMain) { const m2 = await until(() => get(mainUrl), (r) => r.html.includes(`${label} V2`)); check(`${dest} 6 Update reaches Main`, m2.ok, `${m2.s}s`) }
  if (onEnroll) check(`${dest} 6 Update reaches Enrollment`, (await get(enrollUrl)).html.includes(`${label} V2`))

  await openEditor(id)
  await admin.evaluate(() => $e.route('panel/history/revisions'))
  await admin.waitForSelector('.elementor-revision-item', { timeout: 60000 })
  let restored = false
  const items = admin.locator('.elementor-revision-item')
  for (let i = 0; i < Math.min(await items.count(), 6) && !restored; i++) {
    await items.nth(i).click({ force: true }); await sleep(3500)
    const canvas = await admin.frameLocator('#elementor-preview-iframe').locator('body').innerText().catch(() => '')
    if (canvas.includes(`${label} V1`) && !canvas.includes(`${label} V2`)) {
      await admin.getByRole('button', { name: /^Apply$/ }).first().click({ force: true }); await sleep(2500); restored = true
    }
  }
  check(`${dest} 7 History → Revisions: the V1 revision found and applied`, restored)
  await save('publish')
  if (onMain) { const m3 = await until(() => get(mainUrl), (r) => r.html.includes(`${label} V1`) && !r.html.includes(`${label} V2`)); check(`${dest} 7 restored version live on Main`, m3.ok, `${m3.s}s`) }
  if (onEnroll) { const e3 = await get(enrollUrl); check(`${dest} 7 restored version live on Enrollment`, e3.html.includes(`${label} V1`) && !e3.html.includes(`${label} V2`)) }

  const un = await rest('POST', `wp/v2/pages/${id}`, { status: 'draft' })
  check(`${dest} 8 Unpublish (back to Draft)`, un.status === 200 && un.json.status === 'draft')
  if (onMain) { const g = await until(() => get(mainUrl), (r) => r.status !== 200 || !r.html.includes(label)); check(`${dest} 8 gone from Main`, g.ok, `${g.last.status} after ${g.s}s`) }
  if (onEnroll) { const g = await get(enrollUrl); check(`${dest} 8 gone from Enrollment`, g.status !== 200 || !g.html.includes(label), `HTTP ${g.status}`) }
}

async function clashCase() {
  console.log('\n— Both, Main refuses (address already used by a Main blog) —')
  const secret = process.env.WORDPRESS_CMS_WEBHOOK_SECRET
  if (!secret) { check('clash case: shared secret available (read-only list of Main blogs)', false, 'WORDPRESS_CMS_WEBHOOK_SECRET not set'); return }
  const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'acceptance-read-only' }, op: 'list', entity: 'blogs', limit: 50 })
  const ts = Math.floor(Date.now() / 1000)
  const listed = await (await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, secret) }, body: raw })).json().catch(() => ({}))
  const existing = (listed.data || []).find((b) => b.status === 'published' && b.slug)
  if (!existing) { check('clash case: an existing published Main blog found', false); return }
  const before = await get(`${MAIN}/blog/${existing.slug}`)
  const title = `CMS ACCEPTANCE both clash ${T}`
  await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-main&entity=blogs&view=edit`, { timeout: 180000 })
  await admin.fill('[name="acv_field[title]"]', title)
  await admin.fill('[name="acv_field[slug]"]', existing.slug)
  await admin.selectOption('[name="acv_target"]', 'both')
  await admin.selectOption('#acv-status', 'published')
  await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 180000 }), admin.locator('#acv-main-form input[type=submit]').dispatchEvent('click')])
  const box = admin.locator('.acv-cms-flash').first()
  const kind = ((await box.getAttribute('class').catch(() => '')) || '').match(/notice-(success|warning|error)/)?.[1] || 'none'
  const msg = (await box.innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
  await admin.screenshot({ path: path.join(OUT, 'both-clash-message.png') }).catch(() => {})
  check('clash 1 the administrator sees a red message saying the address is in use (no success)', kind === 'error' && /already|in use|taken/i.test(msg), `${kind}: ${msg.slice(0, 160)}`)
  const copies = await rest('GET', `wp/v2/posts?search=${encodeURIComponent(title)}&status=any&per_page=5`)
  check('clash 2 no Enrollment copy was created', Array.isArray(copies.json) && copies.json.filter((p) => (p.title?.rendered || '').includes(title)).length === 0)
  const after = await get(`${MAIN}/blog/${existing.slug}`)
  check('clash 3 the existing Main blog is unchanged', before.status === 200 && after.status === 200 && !after.html.includes(title), `/blog/${existing.slug}`)
}

try {
  console.log(`${LIVE ? 'LIVE' : 'LOCAL'} | WordPress ${WP} | Main ${MAIN} | evidence ${OUT}`)
  for (const d of DESTS) await journey(d)
  if (!process.env.DESTINATION) await clashCase()
} catch (e) {
  check('run finished without an error', false, String(e.message || e).slice(0, 300))
} finally {
  // Whatever happened, every test page ends unpublished (kept as a draft, never deleted automatically).
  for (const k of kept) { const r = await rest('POST', `wp/v2/pages/${k.id}`, { status: 'draft' }).catch(() => ({})); if (r.json?.status !== 'draft') console.log(`WARNING: test page #${k.id} may still be published`) }
  fs.writeFileSync(path.join(OUT, 'test-pages.json'), JSON.stringify(kept, null, 1))
  console.log(`\n${results.filter(Boolean).length} passed, ${results.filter((x) => !x).length} failed [${LIVE ? 'LIVE' : 'LOCAL'}] | test pages kept as drafts: ${kept.map((k) => `#${k.id}`).join(', ') || 'none'}`)
  await browser.close()
  process.exitCode = results.every(Boolean) ? 0 : 1
}
