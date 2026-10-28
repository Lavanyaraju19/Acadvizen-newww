// Live acceptance of the Draft/Published display (plugin 0.7.11) through the real WordPress admin and Elementor
// editor, with an administrator. One clearly labelled, noindexed test page ("CMS STATUS TEST <time>", Publish To:
// Enrollment):
//   draft (not public, status Draft) -> preview (still Draft) -> Publish (Published, live, one Pages-list row, no
//   extra "Draft" row) -> 3 updates through its working copy (same page ID and address, still Published, editor
//   badge "Published ... no unpublished changes") -> an unsaved-to-live change is listed as "Unpublished changes"
//   -> fresh browser session shows the same -> publishing twice creates no new page -> after the live page is moved
//   to the Trash, publishing its working copy is refused and nothing changes -> clean-up (copy and page in Trash).
//
//   WP_STORAGE_STATE=<session.json> node tools/verify-working-copy-live.mjs
// Addresses: WP_URL (default: the live site). Screenshots: EVIDENCE_DIR. Prints no credential.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = (process.env.WP_URL || 'https://enroll.acadvizen.com').replace(/\/$/, '')
const OUT = process.env.EVIDENCE_DIR || path.join(process.cwd(), 'working-copy-live-evidence'); fs.mkdirSync(OUT, { recursive: true })
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const MARK = `CMS STATUS TEST ${T}`, SLUG = `cms-status-test-${T}`
const TRACKING = /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|facebook\.(com|net)|clarity\.ms|hotjar\.(com|io))$/i
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// Playwright's request errors carry a call log with the request's cookies: only ever print an error's first line.
const firstLine = (e) => String(e?.message || e).split('\n')[0].slice(0, 200)
process.on('uncaughtException', (e) => { console.log(`STOP: ${firstLine(e)}`); process.exit(1) })
process.on('unhandledRejection', (e) => { console.log(`STOP: ${firstLine(e)}`); process.exit(1) })
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${new Date().toISOString().slice(11, 19)}Z ${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const get = async (url) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}acvcheck=${Date.now()}`, { redirect: 'manual', signal: AbortSignal.timeout(120000) }); return { status: r.status, html: r.status === 200 ? await r.text() : '' } } catch { await sleep(5000) } } return { status: 0, html: '' } }
const until = async (fn, pred, ms = 240000) => { const t0 = Date.now(); let last; while (Date.now() - t0 < ms) { last = await fn(); if (pred(last)) return { ok: true, last }; await sleep(6000) } last = await fn(); return { ok: pred(last), last } }

const browser = await chromium.launch({ args: ['--disable-gpu'] })
const ctx = await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })
await ctx.route((u) => TRACKING.test(u.hostname), (r) => r.abort())
const page = await ctx.newPage(); page.on('dialog', (d) => d.accept())
await page.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)
const nonce = (await page.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in to wp-admin'); process.exit(2) }
// Reads and moves to the Trash are retried on network errors (the connection this is run from drops now and then);
// both are safe to repeat. Other writes (creating the page, SEO fields) are never retried.
const rest = async (method, route, data, c = ctx, n = nonce) => {
  for (let i = 0; ; i++) {
    try { const r = await c.request.fetch(`${WP}/wp-json/${route}`, { method, headers: { 'X-WP-Nonce': n, 'Content-Type': 'application/json' }, data: data ? JSON.stringify(data) : undefined, timeout: 180000 }); return { status: r.status(), json: await r.json().catch(() => ({})) } } catch (e) { if (i >= 3 || !['GET', 'DELETE'].includes(method) || !/ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/.test(firstLine(e))) throw new Error(firstLine(e)); await sleep(15000) }
  }
}

async function openElementor(id) {
  await page.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 300000 })
  await page.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 300000 })
  await sleep(2000)
  return Number(new URL(page.url()).searchParams.get('post'))
}
async function save(kind) { await page.evaluate(async (k) => { await $e.run(k === 'publish' ? 'document/save/publish' : 'document/save/draft') }, kind); await page.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(3000) }
async function setHeading(text) { await page.evaluate((t) => { const f = (c) => (c.model.get('widgetType') === 'heading' ? c : (c.children || []).map(f).find(Boolean)); $e.run('document/elements/settings', { container: f(elementor.getPreviewContainer()), settings: { title: t } }) }, text) }
// The badge refreshes itself a few seconds after each save; wait (up to 45 s) for the text the step expects.
const badge = async (re = /./) => { await page.waitForSelector('#acv-live-standing', { timeout: 60000 }).catch(() => {}); let t = ''; for (let i = 0; i < 15; i++) { t = (await page.locator('#acv-live-standing').innerText().catch(() => '')).trim(); if (re.test(t)) break; await sleep(3000) } return t }
// What an administrator sees in Pages for this test page: one row per listed record, with its labels.
async function listRows(p = page) {
  await p.goto(`${WP}/wp-admin/edit.php?post_type=page&post_status=all&s=${encodeURIComponent(MARK)}`, { timeout: 300000, waitUntil: 'domcontentloaded' })
  return p.$$eval('#the-list tr[id^="post-"]', (trs) => trs.map((tr) => ({ id: Number(tr.id.replace('post-', '')), status: tr.querySelector('.inline_data ._status, [id^="inline_"] ._status')?.textContent.trim() || '', states: [...tr.querySelectorAll('.post-state')].map((s) => s.textContent.trim().replace(/,$/, '')) })))
}
const pages = async () => (await rest('GET', `wp/v2/pages?status=any&context=edit&per_page=100&search=${encodeURIComponent(MARK)}&_fields=id,status,slug,title`)).json.filter((x) => (x.title?.raw || '').startsWith(MARK))

let liveId = 0, copyId = 0
try {
  console.log(`LIVE | WordPress ${WP} | test page "${MARK}"`)
  const created = await rest('POST', 'wp/v2/pages', { title: MARK, slug: SLUG, status: 'draft', template: 'elementor_header_footer' })
  liveId = created.json.id
  check('1 create: one draft record', created.status === 201 && liveId && created.json.status === 'draft', `#${liveId}`)
  const robots = await rest('POST', 'rankmath/v1/updateMeta', { objectType: 'post', objectID: liveId, meta: { rank_math_robots: ['noindex', 'nofollow'] } })
  check('1 test page noindex before it is ever public', robots.status === 200, `HTTP ${robots.status}`)
  await openElementor(liveId)
  await page.evaluate((v) => {
    $e.run('document/elements/settings', { container: elementor.documents.getCurrent().container, settings: { acv_publish_target: 'enrollment' } })
    const box = $e.run('document/elements/create', { container: elementor.getPreviewContainer(), model: { elType: 'container', settings: { padding: { unit: 'px', top: '60', right: '24', bottom: '60', left: '24', isLinked: false } } } })
    $e.run('document/elements/create', { container: box, model: { elType: 'widget', widgetType: 'heading', settings: { title: v, header_size: 'h1' } } })
  }, `${MARK} V1`)
  await save('draft')
  let s = (await rest('GET', `wp/v2/pages/${liveId}?context=edit&_fields=status`)).json.status
  let pub = await get(`${WP}/${SLUG}/`)
  check('2 save draft: status Draft, not public', s === 'draft' && pub.status !== 200, `status ${s}, public HTTP ${pub.status}`)
  const pv = await ctx.newPage(); const pvr = await pv.goto(`${WP}/?page_id=${liveId}&preview=true`, { timeout: 300000 }); const pvText = await pv.locator('body').innerText().catch(() => ''); await pv.close()
  s = (await rest('GET', `wp/v2/pages/${liveId}?context=edit&_fields=status`)).json.status
  pub = await get(`${WP}/${SLUG}/`)
  check('3 preview shows the draft to the admin; status stays Draft; still not public', pvr.status() === 200 && pvText.includes(`${MARK} V1`) && s === 'draft' && pub.status !== 200, `preview HTTP ${pvr.status()}, status ${s}, public ${pub.status}`)

  await save('publish')
  s = (await rest('GET', `wp/v2/pages/${liveId}?context=edit&_fields=status`)).json.status
  let live = await until(() => get(`${WP}/${SLUG}/`), (x) => x.status === 200 && x.html.includes(`${MARK} V1`))
  check('4 Publish: authoritative status Published, live shows V1', s === 'publish' && live.ok, `status ${s}, public ${live.last.status}`)
  let rows = await listRows()
  check('4 Pages list: one row, the live page, not labelled Draft', rows.length === 1 && rows[0].id === liveId && !rows[0].states.includes('Draft'), JSON.stringify(rows))

  for (const v of ['V2', 'V3', 'V4']) {
    const opened = await openElementor(liveId)
    if (!copyId) copyId = opened
    await setHeading(`${MARK} ${v}`); await save('publish')
    const b = await badge(/no unpublished changes/)
    s = (await rest('GET', `wp/v2/pages/${liveId}?context=edit&_fields=status,slug`)).json
    live = await until(() => get(`${WP}/${SLUG}/`), (x) => x.status === 200 && x.html.includes(`${MARK} ${v}`))
    rows = await listRows()
    const recs = await pages()
    check(`5 update ${v}: same page #${liveId} and address, Published, live shows ${v}; same working copy; editor badge says Published, no unpublished changes; list shows only the live page`,
      opened === copyId && s.status === 'publish' && s.slug === SLUG && live.ok && /Published/.test(b) && /no unpublished changes/.test(b) && rows.length === 1 && rows[0].id === liveId,
      `copy #${opened}, status ${s.status}, slug ${s.slug}, badge "${b.slice(0, 120)}", rows ${JSON.stringify(rows)}, records ${recs.length}`)
  }
  await page.screenshot({ path: path.join(OUT, 'editor-badge-published.png') })

  await openElementor(liveId); await setHeading(`${MARK} V5 unpublished`); await save('draft')
  const b5 = await badge(/not live yet/)
  rows = await listRows()
  const copyRow = rows.find((r) => r.id === copyId)
  live = await get(`${WP}/${SLUG}/`)
  check('6 an unpublished change: live keeps V4; the working copy is listed as "Unpublished changes"; badge says so',
    live.html.includes(`${MARK} V4`) && !live.html.includes('V5 unpublished') && copyRow && copyRow.states.some((x) => /Unpublished changes/.test(x)) && /not live yet/.test(b5), `rows ${JSON.stringify(rows)}, badge "${b5.slice(0, 100)}"`)

  const fresh = await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } }); const fp = await fresh.newPage()
  await fp.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`); const fnonce = (await fp.locator('body').innerText()).trim()
  const frows = await listRows(fp)
  const fst = await rest('GET', `acadvizen-cms/v1/working-copy/${copyId}`, null, fresh, fnonce)
  check('7 fresh session: the live page row is not "Draft"; the copy reports live Published with changes', frows.find((r) => r.id === liveId) && !frows.find((r) => r.id === liveId).states.includes('Draft') && fst.json.live === 'published' && fst.json.changes === true, `rows ${JSON.stringify(frows)}, status ${JSON.stringify(fst.json).slice(0, 160)}`)
  await fresh.close()

  const before = (await pages()).length
  await openElementor(liveId); await setHeading(`${MARK} V6`); await save('publish'); await save('publish')
  live = await until(() => get(`${WP}/${SLUG}/`), (x) => x.status === 200 && x.html.includes(`${MARK} V6`))
  rows = await listRows()
  s = (await rest('GET', `wp/v2/pages/${liveId}?context=edit&_fields=status`)).json.status
  check('8 publishing twice (retry): live V6, still Published, no new page listed', live.ok && s === 'publish' && rows.length === 1 && rows[0].id === liveId, `records before ${before} after ${(await pages()).length} (archives of earlier versions are kept, hidden), rows ${JSON.stringify(rows)}`)

  const tr = await rest('DELETE', `wp/v2/pages/${liveId}`)
  check('9 the live page moved to the Trash (test)', tr.status === 200 && tr.json.status === 'trash', `HTTP ${tr.status}`)
  await openElementor(copyId); await setHeading(`${MARK} V7 must not publish`); await save('publish')
  const b9 = await badge(/in the Trash/)
  const after = (await rest('GET', `wp/v2/pages/${liveId}?context=edit&_fields=status,content`)).json
  pub = await get(`${WP}/${SLUG}/`)
  await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-approvals`, { timeout: 300000 })
  // History rows name the account; only the action, page and result are kept (no e-mail address in the output).
  const hist = await page.$$eval('table.acv-approval-log tbody tr', (trs) => trs.slice(0, 8).map((tr) => [...tr.cells].filter((_, i) => i !== 1).map((c) => c.innerText.trim()).join(' | ').replace(/\s+/g, ' ')))
  // The History table shows the result ("refused"), not the reason code; the badge shows the reason.
  check('9 publishing the working copy of a trashed page is refused: page stays in the Trash, unchanged, not public; history records the refusal; badge says why',
    after.status === 'trash' && !String(after.content?.raw || '').includes('V7') && pub.status !== 200 && hist.some((h) => h.includes(MARK) && /refused/.test(h)) && /in the Trash/.test(b9),
    `status ${after.status}, public ${pub.status}, badge "${b9.slice(0, 90)}", history ${JSON.stringify(hist.filter((h) => /refused/.test(h)).slice(0, 2))}`)
  await page.screenshot({ path: path.join(OUT, 'editor-badge-trashed.png') })
} catch (e) {
  check('run', false, String(e.message).split('\n')[0].slice(0, 200))
} finally {
  // Clean-up: the working copy and the test page end in the Trash (restorable); nothing is deleted permanently.
  try {
    if (copyId) { const c = await rest('DELETE', `wp/v2/pages/${copyId}`); console.log(`cleanup: working copy #${copyId} -> ${c.json.status || c.status}`) }
    if (liveId) { const l = await rest('GET', `wp/v2/pages/${liveId}?context=edit&_fields=status`); if (l.json.status !== 'trash') { const d = await rest('DELETE', `wp/v2/pages/${liveId}`); console.log(`cleanup: test page #${liveId} -> ${d.json.status || d.status}`) } else console.log(`cleanup: test page #${liveId} already in the Trash`) }
    const sm = await get(`${WP}/page-sitemap.xml`)
    console.log(`cleanup: test page in public sitemap: ${sm.html.includes(SLUG)} | public HTTP ${(await get(`${WP}/${SLUG}/`)).status}`)
  } catch (e) { console.log(`cleanup FAILED (${firstLine(e)}): move test page #${liveId} and copy #${copyId} to the Trash by hand`) }
  console.log(`RESULT ${results.filter(Boolean).length}/${results.length} passed`)
  await browser.close()
}
