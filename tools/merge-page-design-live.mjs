// One-off production content change (owner decision, 27 Oct 2026): the newer "-1" design of a page moves into the
// ORIGINAL page, which keeps its address, title, SEO fields, menu links and history; then the "-1" page is retired
// (unpublished, its address 301-redirected to the original, moved to the Trash).
//
//   WP_STORAGE_STATE=<session.json> PAIRS=723:11453,745:11011 EXPORT=<export.json> EVIDENCE_DIR=... \
//     node tools/merge-page-design-live.mjs
//
// Per pair: the "-1" page's design and page settings are taken from the WordPress export (only when the page is
// unchanged since the export); the original opens in Elementor (its working copy), its content is replaced by
// that design (links to the "-1" page itself are pointed at the original), Update publishes it; the live original
// must then show the same content as the live "-1" page (text, widget count, screenshots at 1440 and 390) with its
// own SEO title and description; only then the "-1" page is unpublished, redirected and trashed. Stops at the first
// anomaly. Rollback: Approvals -> Restore on the original; restore the "-1" page from the Trash; delete the redirect.
// Prints no cookie or nonce.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const WP = 'https://enroll.acadvizen.com'
const OUT = process.env.EVIDENCE_DIR || 'merge-evidence'; fs.mkdirSync(OUT, { recursive: true })
const PAIRS = String(process.env.PAIRS || '').split(',').filter(Boolean).map((p) => p.split(':').map(Number))
const exp = new Map(JSON.parse(fs.readFileSync(process.env.EXPORT, 'utf8')).filter((i) => i.type === 'page').map((i) => [i.id, i]))
const m1 = (i, k) => (i?.meta[k] || [])[0] || ''
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const short = (e) => String(e?.message || e).split('\n')[0].slice(0, 200)
const t = () => new Date().toISOString().slice(11, 19) + 'Z'
const log = (s) => console.log(`${t()} ${s}`)
const php = (s) => { // the export's PHP-serialized page settings (flat string/array of strings)
  const out = {}; for (const m of s.matchAll(/s:\d+:"([^"]+)";s:\d+:"([^"]*)";/g)) out[m[1]] = m[2]; return out
}
const b = await chromium.launch({ args: ['--disable-gpu'] })
const ctx = await b.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })
const admin = await ctx.newPage(); admin.on('dialog', (d) => d.accept())
await admin.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`); const nonce = (await admin.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { log('STOP: not signed in'); process.exit(2) }
const rest = async (method, route, data) => { try { const r = await ctx.request.fetch(`${WP}/wp-json/${route}`, { method, headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: data ? JSON.stringify(data) : undefined, timeout: 180000 }); return { status: r.status(), json: await r.json().catch(() => ({})) } } catch (e) { return { status: 0, json: {}, err: short(e) } } }
// The page's own content as an anonymous visitor sees it.
async function look(url, docId, width, shot) {
  const c = await b.newContext({ viewport: { width, height: 900 } }); const p = await c.newPage()
  // A cache-busting parameter WordPress does not reserve ("m" is its date-archive parameter: it answers 404).
  const r = await p.goto(`${url}?acvmerge=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => null); await p.waitForLoadState('load', { timeout: 60000 }).catch(() => {}); await sleep(2500)
  const s = await p.evaluate((id) => { const root = document.querySelector(`[data-elementor-id="${id}"]`); return root ? { text: root.innerText.replace(/\s+/g, ' ').trim(), widgets: root.querySelectorAll('.elementor-widget').length, title: document.title, desc: document.querySelector('meta[name="description"]')?.content || '', canonical: document.querySelector('link[rel="canonical"]')?.href || '' } : { text: '', widgets: 0, title: document.title } }, docId).catch(() => ({ text: '', widgets: 0 }))
  if (shot) await p.screenshot({ path: path.join(OUT, `${shot}-${width}.png`), fullPage: true }).catch(() => {})
  await c.close(); return { status: r ? r.status() : 0, ...s }
}
const sim = (a, b) => { const sh = (x) => { const w = x.toLowerCase().split(' '); const s = new Set(); for (let k = 0; k + 4 <= w.length; k++) s.add(w.slice(k, k + 4).join(' ')); return s }; const A = sh(a), B = sh(b); let n = 0; for (const x of A) if (B.has(x)) n++; return A.size + B.size ? n / (A.size + B.size - n) : 0 }

for (const [o, n] of PAIRS) {
  try {
    const O = (await rest('GET', `wp/v2/pages/${o}?context=edit&_fields=id,slug,status,link,title`)).json, N = (await rest('GET', `wp/v2/pages/${n}?context=edit&_fields=id,slug,status,link,modified_gmt,title`)).json
    const NE = exp.get(n)
    if (O.status !== 'publish' || N.status !== 'publish') { log(`SKIP ${o}:${n}: not both published (${O.status}, ${N.status})`); continue }
    if (N.modified_gmt !== NE.modified.replace(' ', 'T')) { log(`STOP ${o}:${n}: "-1" page changed since the export (${N.modified_gmt})`); break }
    let elements = m1(NE, '_elementor_data').split(`"post_id%22%3A%22${n}%22`).join(`"post_id%22%3A%22${o}%22`).split(`%22post_id%22%3A%22${n}%22`).join(`%22post_id%22%3A%22${o}%22`)
    elements = JSON.parse(elements)
    const settings = php(m1(NE, '_elementor_page_settings'))
    const nBefore = []; for (const w of [1440, 390]) nBefore.push(await look(N.link, n, w, `${N.slug}-source`))
    const oBefore = await look(O.link, o, 1440, `${O.slug}-before`)
    log(`pair /${O.slug}/ #${o} <- /${N.slug}/ #${n}: source ${elements.length} top-level elements, ${nBefore[0].widgets} widgets; original before: ${oBefore.widgets} widgets, title "${oBefore.title}"`)
    // A re-run after an interrupted verification: the original already shows the "-1" content, nothing to publish.
    const already = oBefore.status === 200 && sim(oBefore.text, nBefore[0].text) >= 0.95
    if (already) log('  the original already shows the "-1" content (merged earlier); verifying only')
    if (!already) {
    await admin.goto(`${WP}/wp-admin/post.php?post=${o}&action=elementor`, { timeout: 300000 })
    await admin.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 300000 }); await sleep(3000)
    const copy = Number(new URL(admin.url()).searchParams.get('post'))
    const placed = await admin.evaluate(({ elements, settings }) => {
      $e.run('document/elements/empty', { force: true })
      elements.forEach((el, i) => $e.run('document/elements/create', { container: elementor.getPreviewContainer(), model: el, options: { at: i, edit: false } }))
      const keep = {}; for (const [k, v] of Object.entries(settings)) if (k !== 'acv_publish_target') keep[k] = v
      if (Object.keys(keep).length) $e.run('document/elements/settings', { container: elementor.documents.getCurrent().container, settings: keep })
      const count = (c) => (c.children || []).reduce((s, x) => s + 1 + count(x), 0)
      return { top: elementor.getPreviewContainer().children.length, all: count(elementor.getPreviewContainer()) }
    }, { elements, settings })
    log(`  editor #${copy} (working copy of #${o}): ${placed.top} top-level / ${placed.all} elements placed`)
    if (placed.top !== elements.length) { log('  STOP: not every element was placed; nothing published'); break }
    // Elementor's own publish command (the action behind its Publish/Update button, which proved unreliable on
    // large pages: on 27 Oct a click saved the working copy without publishing it).
    await admin.evaluate(async () => { await $e.run('document/save/publish') })
    await sleep(1500); await admin.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 300000 }); await sleep(5000)
    }
    // The live original must now show the "-1" content, with its own SEO.
    let after = [], score = 0
    for (let i = 0; i < 10; i++) { after = []; for (const w of [1440, 390]) after.push(await look(O.link, o, w, `${O.slug}-after`)); score = sim(after[0].text, nBefore[0].text); if (score >= 0.95) break; await sleep(15000) }
    const rmTitle = m1(exp.get(o), 'rank_math_title').replace(/&amp;/g, '&')
    const seoKept = (rmTitle ? after[0].title.startsWith(rmTitle.replace(/%[a-z_]+%/g, '').trim().slice(0, 30)) : after[0].title === oBefore.title) && (after[0].canonical || '').replace(/\/$/, '') === O.link.replace(/\/$/, '')
    const ok = after.every((x) => x.status === 200) && score >= 0.95 && Math.abs(after[0].widgets - nBefore[0].widgets) <= 2 && seoKept
    log(`  ${ok ? 'PASS' : 'FAIL'} live original: content match ${(score * 100).toFixed(1)}%, widgets ${after[0].widgets} vs ${nBefore[0].widgets}, phone ${after[1].status}, title "${after[0].title}" (kept ${seoKept}), canonical ${after[0].canonical}`)
    if (!ok) { log('  STOP: the "-1" page is left untouched'); break }
    // Retire the "-1" page: unpublish (Quick Edit -> Draft), redirect its address, Trash.
    // Exact-title search: a plain search also matches every page whose text contains the words.
    await admin.goto(`${WP}/wp-admin/edit.php?post_type=page&post_status=publish&exact=1&sentence=1&s=${encodeURIComponent(N.title.raw)}`, { timeout: 180000 })
    await admin.waitForSelector(`#post-${n}`, { state: 'attached', timeout: 120000 })
    await admin.locator(`#post-${n} button.editinline`).dispatchEvent('click'); await admin.locator(`#edit-${n} select[name="_status"]`).selectOption('draft'); await admin.locator(`#edit-${n} button.save`).dispatchEvent('click')
    await admin.waitForSelector(`#post-${n}:not(.inline-editor)`, { timeout: 120000 }).catch(() => {}); await sleep(3000)
    const st = (await rest('GET', `wp/v2/pages/${n}?context=edit&_fields=status`)).json.status
    const red = await rest('POST', 'rankmath/v1/updateRedirection', { objectID: n, objectType: 'post', hasRedirect: true, redirectionUrl: O.link, redirectionSources: N.slug, redirectionType: 301 })
    let r301 = null; for (let i = 0; i < 6; i++) { r301 = await fetch(`${N.link}?r=${Date.now()}`, { redirect: 'manual' }); if (r301.status === 301) break; await sleep(5000) }
    const loc = r301.headers.get('location') || ''
    const trashed = st === 'draft' && r301.status === 301 && loc.replace(/\?.*$/, '').replace(/\/$/, '') === O.link.replace(/\/$/, '') ? (await rest('DELETE', `wp/v2/pages/${n}`)).json.status : 'not trashed'
    log(`  ${st === 'draft' && r301.status === 301 && trashed === 'trash' ? 'DONE' : 'FAIL'} "-1" page #${n}: ${st}, /${N.slug}/ -> ${r301.status} ${loc} (redirect saved HTTP ${red.status}), ${trashed}`)
    if (trashed !== 'trash') break
  } catch (e) { log(`STOP ${o}:${n}: ${short(e)}`); break }
}
await b.close()
