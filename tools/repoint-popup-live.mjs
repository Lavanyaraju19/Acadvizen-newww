// Production content fix (owner decision, 28 Oct 2026): buttons that open an unpublished Elementor popup do nothing
// for visitors. This points them at a published popup instead, through the normal workflow: the live page opens in
// Elementor (its working copy), every element whose dynamic link opens popup FROM is changed to open popup TO (the
// rest of the design is untouched), an optional new page title is set, the administrator's publish publishes it, and
// the live page is checked (no link to FROM left, TO linked, title). Refuses a page whose working copy holds
// unpublished changes (compared with the live page in the parsed WordPress export given as EXPORT).
//
//   WP_STORAGE_STATE=<session.json> EXPORT=<parsed-export.json> PAGES=969,1300 FROM=2941 TO=7696 \
//     [TITLES='11892=Home'] node tools/repoint-popup-live.mjs
// Rollback: Approvals -> Recent publications -> Restore on the page. Prints no cookie or nonce.
import fs from 'node:fs'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const WP = 'https://enroll.acadvizen.com'
const PAGES = String(process.env.PAGES || '').split(',').filter(Boolean).map(Number)
const FROM = String(process.env.FROM || ''), TO = String(process.env.TO || '')
const TITLES = Object.fromEntries(String(process.env.TITLES || '').split(',').filter(Boolean).map((x) => { const [id, ...t] = x.split('='); return [Number(id), t.join('=')] }))
const exp = new Map(JSON.parse(fs.readFileSync(process.env.EXPORT, 'utf8')).filter((i) => i.type === 'page').map((i) => [i.id, i]))
const m1 = (i, k) => (i?.meta[k] || [])[0] || ''
// Pages whose working-copy changes the owner approved publishing together with this fix (e.g. ALLOW_COPY_CHANGES=11892).
const ALLOW = new Set(String(process.env.ALLOW_COPY_CHANGES || '').split(',').filter(Boolean).map(Number))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const t = () => new Date().toISOString().slice(11, 19) + 'Z'
const short = (e) => String(e?.message || e).split('\n')[0].slice(0, 160)
const b64 = (id) => Buffer.from(`{"id":"${id}"`).toString('base64') // how Elementor's action links carry the popup id
if (!/^\d+$/.test(FROM) || !/^\d+$/.test(TO) || !PAGES.length) { console.log('Set PAGES, FROM and TO'); process.exit(2) }
const b = await chromium.launch({ args: ['--disable-gpu'] }); const ctx = await b.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } }); const admin = await ctx.newPage()
await admin.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`); const nonce = (await admin.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in'); process.exit(2) }
const page = async (id) => (await (await ctx.request.get(`${WP}/wp-json/wp/v2/pages/${id}?context=edit&_fields=id,slug,status,link,title,modified_gmt`, { headers: { 'X-WP-Nonce': nonce } })).json())
const live = async (url) => { for (let i = 0; i < 3; i++) { try { return await (await fetch(`${url}?acvpop=${Date.now()}`, { signal: AbortSignal.timeout(120000) })).text() } catch { await sleep(5000) } } return '' }
for (const id of PAGES) {
  try {
    const before = await page(id)
    if (before.status !== 'publish') { console.log(`${t()} SKIP #${id}: not published`); continue }
    // Someone's unpublished work in the existing working copy: never published by this tool.
    const L = exp.get(id), copyId = Number(m1(L, '_acv_working_copy')), C = copyId && exp.get(copyId)
    if (C && C.status !== 'trash' && !ALLOW.has(id) && (m1(C, '_elementor_data') !== m1(L, '_elementor_data') || C.title !== L.title)) { console.log(`${t()} SKIP #${id}: its working copy #${copyId} holds unpublished changes`); continue }
    if (L && before.modified_gmt.replace('T', ' ') !== L.modified) { console.log(`${t()} SKIP #${id}: changed since the export (${L.modified} -> ${before.modified_gmt}); export again`); continue }
    const html0 = await live(before.link)
    await admin.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: 480000, waitUntil: 'domcontentloaded' })
    await admin.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 480000 }); await sleep(2500)
    const copy = Number(new URL(admin.url()).searchParams.get('post'))
    if (C && C.status !== 'trash' && copy !== copyId) { console.log(`${t()} SKIP #${id}: opened copy #${copy}, expected #${copyId}`); continue }
    const changed = await admin.evaluate(({ from, to }) => {
      const out = []; const walk = (c) => { for (const ch of c.children || []) {
        const dyn = ch.settings?.get?.('__dynamic__') || {}
        const keys = Object.keys(dyn).filter((k) => typeof dyn[k] === 'string' && dyn[k].includes('name="popup"') && dyn[k].includes(`%22popup%22%3A%22${from}%22`))
        if (keys.length) { const next = {}; keys.forEach((k) => { next[k] = dyn[k].replace(`%22popup%22%3A%22${from}%22`, `%22popup%22%3A%22${to}%22`) }); $e.run('document/dynamic/settings', { container: ch, settings: next }); out.push(`${ch.id}:${keys.join('+')}`) }
        walk(ch) } }
      walk(elementor.getPreviewContainer()); return out
    }, { from: FROM, to: TO })
    if (TITLES[id]) await admin.evaluate((title) => { $e.run('document/elements/settings', { container: elementor.documents.getCurrent().container, settings: { post_title: title } }) }, TITLES[id])
    if (!changed.length && !TITLES[id]) { console.log(`${t()} NOTHING #${id}: no element opens popup ${FROM}`); continue }
    await Promise.race([admin.evaluate(async () => { await $e.run('document/save/publish') }), sleep(180000).then(() => { throw new Error('save did not finish within 3 minutes') })])
    await sleep(1500); await admin.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(5000)
    let html = '', ok = false
    for (let i = 0; i < 12 && !ok; i++) { html = await live(before.link); ok = !html.includes(b64(FROM)) && html.includes(b64(TO)); if (!ok) await sleep(10000) }
    const after = await page(id)
    const titleOk = !TITLES[id] || after.title.raw === TITLES[id]
    console.log(`${t()} ${ok && titleOk && after.status === 'publish' && after.slug === before.slug ? 'DONE' : 'FAIL'} #${id} /${before.slug}/ (copy #${copy}) elements ${changed.join(',') || '-'} | live: links to ${FROM} ${(html0.split(b64(FROM)).length - 1)} -> ${(html.split(b64(FROM)).length - 1)}, to ${TO} ${(html0.split(b64(TO)).length - 1)} -> ${(html.split(b64(TO)).length - 1)} | status ${after.status} | title "${after.title.raw}"${TITLES[id] ? ` (wanted "${TITLES[id]}")` : ''} | address unchanged ${after.slug === before.slug}`)
  } catch (e) { console.log(`${t()} FAIL #${id}: ${short(e)}`) }
}
await b.close()
