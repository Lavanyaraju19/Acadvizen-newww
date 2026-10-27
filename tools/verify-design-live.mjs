// Live acceptance of DESIGN changes made in the real Elementor editor and published to Main / Enrollment / Both,
// verified by measuring the rendered styles in a fresh, anonymous browser at desktop (1440) and phone (390) width.
//
//   WP_STORAGE_STATE=<session.json> node tools/verify-design-live.mjs            main, enrollment, both
//   DESTINATION=main WP_STORAGE_STATE=... node tools/verify-design-live.mjs
//
// For each destination, on ONE new labelled, noindex test page ("CMS DESIGN TEST <dest> <time>"):
//   1 create the draft; 2 in Elementor: section background colour, padding (desktop 48 px, phone 16 px), heading
//   text + typography (44 px desktop / 28 px phone, weight 700, colour), paragraph, button label + colour + link,
//   an image from the Media Library, row on desktop / column on phone; Publish To; Save Draft -> not public;
//   3 Preview: the measured styles match; 4 Publish (Elementor's own Publish button when the top bar offers it)
//   -> live: the same styles at 1440 and 390, noindex, not in the sitemap, linked from no menu; 5 Update (heading
//   text, heading colour, background colour) -> same page id and address, the new styles live; 6 Update clicked
//   twice in quick succession -> still one page at that address, one Main record, no duplicate; 7 cleanup:
//   unpublished (gone from both websites), then the page, its working copies and its archives go to the Trash.
// Prints no credential, cookie or nonce; errors print their first line only.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = (process.env.WP_URL || 'https://enroll.acadvizen.com').replace(/\/$/, '')
const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const OUT = process.env.EVIDENCE_DIR || path.join(process.cwd(), 'design-live-evidence'); fs.mkdirSync(OUT, { recursive: true })
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const DESTS = (process.env.DESTINATION || 'main,enrollment,both').split(',')
const TRACKING = /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|facebook\.(com|net)|clarity\.ms|hotjar\.(com|io))$/i
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const short = (e) => String(e?.message || e).split('\n')[0].slice(0, 200)
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${new Date().toISOString().slice(11, 19)}Z ${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const info = (m) => console.log(`${new Date().toISOString().slice(11, 19)}Z INFO ${m}`)
const V1 = { bg: '#123456', bgRgb: 'rgb(18, 52, 86)', head: '#F5C518', headRgb: 'rgb(245, 197, 24)', btn: '#E11D48', btnRgb: 'rgb(225, 29, 72)' }
const V2 = { bg: '#0F766E', bgRgb: 'rgb(15, 118, 110)', head: '#22C55E', headRgb: 'rgb(34, 197, 94)' }

// Network reads are retried once: a single dropped connection must not stop the run before its cleanup.
async function fetchText(url, opts = {}) { for (let i = 0; ; i++) { try { const r = await fetch(url, opts); return { status: r.status, text: r.status === 200 ? await r.text() : '' } } catch (e) { if (i) return { status: 0, text: '' }; await sleep(3000) } } }
async function get(url) { const r = await fetchText(`${url}${url.includes('?') ? '&' : '?'}dz=${Date.now()}`, { redirect: 'manual', headers: { 'user-agent': 'acadvizen-acceptance (labelled test page)' } }); return { status: r.status, html: r.text } }
async function until(fn, pred, ms = 300000) { const t0 = Date.now(); let last; while (Date.now() - t0 < ms) { last = await fn(); if (pred(last)) return { ok: true, s: Math.round((Date.now() - t0) / 1000), last }; await sleep(5000) } return { ok: false, s: Math.round((Date.now() - t0) / 1000), last } }

const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-features=CalculateNativeWinOcclusion'] })
const adminCtx = await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })
await adminCtx.route((u) => TRACKING.test(u.hostname), (r) => r.abort())
const admin = await adminCtx.newPage(); admin.on('dialog', (d) => d.accept())
await admin.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)
const nonce = (await admin.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in to wp-admin'); process.exit(2) }
const rest = async (method, route, data) => { try { const r = await adminCtx.request.fetch(`${WP}/wp-json/${route}`, { method, headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: data ? JSON.stringify(data) : undefined, timeout: 180000 }); return { status: r.status(), json: await r.json().catch(() => ({})) } } catch (e) { return { status: 0, json: {}, err: short(e) } } }
const media = (await rest('GET', 'wp/v2/media?media_type=image&per_page=1&orderby=date&mime_type=image/png')).json[0]

async function openEditor(id) {
  await admin.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 180000 })
  await admin.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 300000 })
  await sleep(2500)
  return Number(new URL(admin.url()).searchParams.get('post')) || id
}
// Elementor's own Publish / Update button in the editor's top bar; Elementor's save command when the bar has none.
async function clickPublish(times = 1) {
  const btn = admin.locator('button').filter({ hasText: /^\s*(Publish|Update|Submit)\s*$/ }).first()
  let how = 'command'
  if (await btn.isVisible().catch(() => false)) {
    let clicks = 0
    for (let i = 0; i < times; i++) if (await btn.click({ timeout: 15000 }).then(() => true).catch(() => false)) clicks++
    if (!clicks) await admin.evaluate(async () => { await $e.run('document/save/publish') }).catch(() => {})
    how = clicks ? `top-bar button x${clicks}` : 'command (button not clickable)'
  } else {
    for (let i = 0; i < times; i++) await admin.evaluate(async () => { await $e.run('document/save/publish') }).catch(() => {})
  }
  await sleep(1500)
  await admin.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(2500)
  return how
}
async function saveDraft() { await admin.evaluate(async () => { await $e.run('document/save/draft') }); await admin.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(2000) }
// Rendered styles of the test content (scoped to the page's own Elementor document).
async function measure(page, docId) {
  return page.evaluate((id) => {
    const root = document.querySelector(`[data-elementor-id="${id}"]`); if (!root) return { scoped: false }
    const box = root.querySelector('.e-con'), h = root.querySelector('.elementor-heading-title'), b = root.querySelector('a.elementor-button'), img = root.querySelector('.elementor-widget-image img'), p = root.querySelector('.elementor-widget-text-editor')
    const cs = (e) => (e ? getComputedStyle(e) : {})
    const inner = box?.querySelector(':scope > .e-con-inner') || box
    // A boxed container renders its top/bottom padding on the inner wrapper, left/right on the outer element.
    const pad = parseFloat(cs(box).paddingTop) > 0 ? cs(box).paddingTop : cs(inner).paddingTop
    return { scoped: true, heading: h?.textContent.trim() || '', size: cs(h).fontSize, weight: cs(h).fontWeight, color: cs(h).color, bg: cs(box).backgroundColor, pad, dir: cs(inner).flexDirection, button: b?.textContent.trim() || '', btnBg: cs(b).backgroundColor, btnHref: b?.getAttribute('href') || '', image: img ? img.complete && img.naturalWidth > 0 : false, para: p?.textContent.trim().slice(0, 40) || '', fits: document.documentElement.scrollWidth <= window.innerWidth + 1 }
  }, docId)
}
async function view(url, width, docId, shot, ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, ...ctxOpts }); await ctx.route((u) => TRACKING.test(u.hostname), (r) => r.abort())
  const p = await ctx.newPage(); let r = null
  try { r = await p.goto(`${url}${url.includes('?') ? '&' : '?'}dz=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 }) } catch (e) { info(`open ${url}: ${short(e)}`) }
  await p.waitForLoadState('load', { timeout: 30000 }).catch(() => {}); await sleep(2500); const m = await measure(p, docId).catch(() => ({ scoped: false }))
  const head = { robots: await p.locator('meta[name="robots"]').first().getAttribute('content').catch(() => '') || '' }
  if (shot) await p.screenshot({ path: path.join(OUT, `${shot}-${width}.png`), fullPage: true }).catch(() => {})
  await ctx.close(); return { status: r ? r.status() : 0, ...m, ...head }
}
const expect = (m, v, width, text) => m.scoped && m.heading === text && m.color === v.headRgb && m.bg === v.bgRgb && m.size === (width < 768 ? '28px' : '44px') && m.weight === '700' && m.pad === (width < 768 ? '16px' : '48px') && m.dir === (width < 768 ? 'column' : 'row')
const fmt = (m) => `"${m.heading}" ${m.size}/${m.weight} ${m.color} bg ${m.bg} pad ${m.pad} ${m.dir} btn "${m.button}" ${m.btnBg} img:${m.image} fits:${m.fits}`

// CLEANUP_PAGES='[{"id":1,"label":"…","slug":"…","dest":"…"}]': only clean up test pages left by an earlier run.
const created = process.env.CLEANUP_PAGES ? JSON.parse(process.env.CLEANUP_PAGES) : []
async function journey(dest) {
  const label = `CMS DESIGN TEST ${dest.toUpperCase()} ${T}`, slug = `cms-design-test-${dest}-${T}`
  const mainUrl = `${MAIN}/${slug}`, enrollUrl = `${WP}/${slug}/`
  const onMain = dest !== 'enrollment', onEnroll = dest !== 'main'
  const urls = [['Main', onMain && mainUrl], ['Enrollment', onEnroll && enrollUrl]].filter(([, u]) => u)
  console.log(`\n— ${dest}: "${label}" | ${urls.map(([s, u]) => `${s} ${u}`).join(' | ')} —`)
  const c = await rest('POST', 'wp/v2/pages', { title: label, slug, status: 'draft', template: 'elementor_header_footer' })
  const id = c.json.id; check(`${dest} 1 test page created as a draft`, c.status === 201 && id, `#${id}`); if (!id) return
  created.push({ id, label, slug, dest })
  const rb = await rest('POST', 'rankmath/v1/updateMeta', { objectType: 'post', objectID: id, meta: { rank_math_robots: ['noindex', 'nofollow'] } })
  check(`${dest} 1 noindex set before publishing`, rb.status === 200)
  await openEditor(id)
  await admin.evaluate(({ label, dest, v, img }) => {
    $e.run('document/elements/settings', { container: elementor.documents.getCurrent().container, settings: { acv_publish_target: dest } })
    const box = $e.run('document/elements/create', { container: elementor.getPreviewContainer(), model: { elType: 'container', settings: { flex_direction: 'row', flex_direction_mobile: 'column', background_background: 'classic', background_color: v.bg, padding: { unit: 'px', top: '48', right: '48', bottom: '48', left: '48', isLinked: true }, padding_mobile: { unit: 'px', top: '16', right: '16', bottom: '16', left: '16', isLinked: true } } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'heading', settings: { title: `${label} V1`, header_size: 'h1', title_color: v.head, typography_typography: 'custom', typography_font_size: { unit: 'px', size: 44 }, typography_font_size_mobile: { unit: 'px', size: 28 }, typography_font_weight: '700' } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'text-editor', settings: { editor: '<p>Labelled design test page; removed at the end of the test.</p>' } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'button', settings: { text: 'Design test button', link: { url: '#design-test', is_external: '', nofollow: '' }, background_color: v.btn, button_background_color: v.btn } } })
    if (img) $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'image', settings: { image: { id: img.id, url: img.url } } } })
  }, { label, dest, v: V1, img: media ? { id: media.id, url: media.source_url } : null })
  await saveDraft()
  const d = await Promise.all(urls.map(([, u]) => get(u)))
  check(`${dest} 2 Save Draft: not public`, d.every((r) => r.status !== 200 || !r.html.includes(label)), d.map((r) => r.status).join(','))
  // Preview (signed in) at desktop and phone width.
  const previewUrl = await admin.evaluate(() => elementor.documents.getCurrent().config.urls.wp_preview)
  const pv = []; for (const w of [1440, 390]) pv.push(await view(previewUrl, w, id, `${dest}-preview`, { storageState: process.env.WP_STORAGE_STATE }))
  check(`${dest} 3 Preview shows the saved design at 1440 and 390`, pv.every((m, i) => expect(m, V1, [1440, 390][i], `${label} V1`) && m.btnBg === V1.btnRgb && m.button === 'Design test button'), pv.map(fmt).join(' || '))

  const how = await clickPublish(1); info(`${dest} Publish via ${how}`)
  const pub = await rest('GET', `wp/v2/pages/${id}?context=edit`)
  check(`${dest} 4 published; page id unchanged`, pub.json.status === 'publish' && pub.json.id === id, `#${pub.json.id} ${pub.json.status}`)
  const t0 = Date.now()
  for (const [site, url] of urls) {
    const live = await until(() => get(url), (r) => r.html.includes(`${label} V1`))
    check(`${dest} 4 live on ${site}`, live.ok, `${live.s}s after Publish`)
    const vs = []; for (const w of [1440, 390]) vs.push(await view(url, w, id, `${dest}-${site.toLowerCase()}-v1`))
    check(`${dest} 4 ${site}: measured design matches at 1440 and 390 (typography, colours, padding, layout, button, image)`, vs.every((m, i) => m.status === 200 && expect(m, V1, [1440, 390][i], `${label} V1`) && m.btnBg === V1.btnRgb && m.image && m.fits), vs.map(fmt).join(' || '))
    check(`${dest} 4 ${site}: noindex`, /noindex/i.test(vs[0].robots), vs[0].robots)
  }
  info(`${dest} propagation: ${Math.round((Date.now() - t0) / 1000)} s for all checks`)
  for (const [site, sm, home] of [['Main', `${MAIN}/sitemap.xml`, MAIN], ['Enrollment', `${WP}/sitemap_index.xml`, WP]]) {
    let xml = (await fetchText(sm)).text; for (const s of [...xml.matchAll(/<loc>([^<]+\.xml)<\/loc>/g)].map((m) => m[1])) xml += (await fetchText(s)).text
    const homeHtml = (await get(home)).html
    check(`${dest} 4 ${site}: not in the sitemap, not linked from the homepage navigation`, !xml.includes(slug) && !homeHtml.includes(slug))
  }

  // Update: heading text, heading colour, background colour.
  const copy = await openEditor(id)
  await admin.evaluate(({ label, v }) => {
    const find = (c, t) => (c.model.get('widgetType') === t || c.model.get('elType') === t ? c : (c.children || []).map((x) => find(x, t)).find(Boolean))
    const root = elementor.getPreviewContainer()
    $e.run('document/elements/settings', { container: find(root, 'heading'), settings: { title: `${label} V2`, title_color: v.head } })
    $e.run('document/elements/settings', { container: find(root, 'container'), settings: { background_color: v.bg } })
  }, { label, v: V2 })
  const how2 = await clickPublish(1); info(`${dest} Update via ${how2} (editor opened #${copy}, the working copy of #${id})`)
  for (const [site, url] of urls) {
    const live = await until(() => get(url), (r) => r.html.includes(`${label} V2`))
    const vs = []; for (const w of [1440, 390]) vs.push(await view(url, w, id, `${dest}-${site.toLowerCase()}-v2`))
    check(`${dest} 5 Update live on ${site} at the same address, measured design updated`, live.ok && vs.every((m, i) => expect(m, V2, [1440, 390][i], `${label} V2`)), `${live.s}s | ${vs.map(fmt).join(' || ')}`)
  }
  const after = await rest('GET', `wp/v2/pages/${id}?context=edit`)
  check(`${dest} 5 same page id and address after Update`, after.json.id === id && after.json.slug === slug && after.json.status === 'publish', `#${after.json.id} /${after.json.slug}/`)

  // Repeat: Update clicked twice quickly, no change.
  await openEditor(id); const how3 = await clickPublish(2); info(`${dest} repeat Update via ${how3}`)
  await sleep(20000)
  const same = await rest('GET', `wp/v2/pages?search=${encodeURIComponent(label)}&status=publish&per_page=20&_fields=id,slug,status`)
  const bySlug = await rest('GET', `wp/v2/pages?slug=${slug}&status=publish,draft,pending&per_page=20&_fields=id,status`)
  check(`${dest} 6 repeated Update: one published page with this title and address, same id`, Array.isArray(same.json) && same.json.length === 1 && same.json[0].id === id && bySlug.json.length === 1, `published with this title: ${same.json.map?.((x) => '#' + x.id).join(',')} | at the address: ${bySlug.json.map?.((x) => '#' + x.id + ' ' + x.status).join(',')}`)
  for (const [site, url] of urls) { const r = await get(url); check(`${dest} 6 ${site} still shows the latest version once`, r.status === 200 && (r.html.match(new RegExp(`${label} V2`, 'g')) || []).length >= 1 && !r.html.includes(`${label} V1`)) }
}

async function cleanup() {
  for (const c of created) {
    let st = (await rest('GET', `wp/v2/pages/${c.id}?context=edit`)).json.status
    if (st === 'publish') {
      // Unpublish as an administrator does: Pages -> Quick Edit -> Draft.
      await admin.goto(`${WP}/wp-admin/edit.php?post_type=page&post_status=all&s=${encodeURIComponent(c.label)}`, { timeout: 180000 })
      await admin.locator(`#post-${c.id} button.editinline`).dispatchEvent('click').catch(() => {})
      await admin.locator(`#edit-${c.id} select[name="_status"]`).selectOption('draft').catch(() => {})
      await admin.locator(`#edit-${c.id} button.save`).dispatchEvent('click').catch(() => {})
      await admin.waitForSelector(`#post-${c.id}:not(.inline-editor)`, { timeout: 120000 }).catch(() => {}); await sleep(3000)
      st = (await rest('GET', `wp/v2/pages/${c.id}?context=edit`)).json.status
    }
    const gone = await until(async () => Promise.all([get(`${MAIN}/${c.slug}`), get(`${WP}/${c.slug}/`)]), (rs) => rs.every((r) => r.status !== 200 || !r.html.includes(c.label)), 300000)
    check(`cleanup ${c.dest}: unpublished and gone from both websites`, st === 'draft' && gone.ok, `status ${st}`)
    // The page, its working copies and archives (same title) to the Trash.
    const all = await rest('GET', `wp/v2/pages?search=${encodeURIComponent(c.label)}&status=draft,pending,private&per_page=50&context=edit&_fields=id,title,status`)
    const mine = (all.json || []).filter((p) => p.title?.raw === c.label || p.title?.raw?.startsWith(c.label))
    let n = 0; for (const p of mine) { const d = await rest('DELETE', `wp/v2/pages/${p.id}`); if (d.status === 200) n++ }
    check(`cleanup ${c.dest}: the test page and its copies/archives moved to the Trash`, n === mine.length && mine.some((p) => p.id === c.id), `${n}/${mine.length}: ${mine.map((p) => '#' + p.id).join(',')}`)
  }
}

try {
  console.log(`LIVE | ${WP} | ${MAIN} | image #${media?.id} | evidence ${OUT}`)
  if (!process.env.CLEANUP_PAGES) for (const d of DESTS) await journey(d)
} catch (e) { check('run finished without an error', false, short(e)) }
finally {
  await cleanup().catch((e) => check('cleanup finished without an error', false, short(e)))
  fs.writeFileSync(path.join(OUT, 'test-pages.json'), JSON.stringify(created, null, 1))
  console.log(`\n${results.filter(Boolean).length} passed, ${results.filter((x) => !x).length} failed [LIVE] | test pages: ${created.map((c) => '#' + c.id).join(', ')}`)
  await browser.close(); process.exitCode = results.every(Boolean) ? 0 : 1
}
