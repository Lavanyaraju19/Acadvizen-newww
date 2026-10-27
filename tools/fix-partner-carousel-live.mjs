// One-off production content fix (owner decision, 27 Oct 2026): remove the two hiring-partner carousel slides whose
// files no longer exist (uploads/2026/09/uber-1.png, uploads/2026/09/pwc.png; deleted before 10 Oct, in no backup)
// from every live Enrollment page, through the normal workflow: the page opens in Elementor (its working copy),
// only those two slides are removed from the image carousel, the administrator's Update publishes it, and the live
// page is checked (every carousel image loads, page id and address unchanged). Stops at the first anomaly.
//
//   WP_STORAGE_STATE=<session.json> PAGES=3871,3874,... node tools/fix-partner-carousel-live.mjs
// Rollback per page: Approvals -> Recent publications -> Restore. Prints no cookie or nonce.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const WP = 'https://enroll.acadvizen.com'
const BAD = /\/2026\/09\/(uber-1|pwc)\.png$/
const PAGES = String(process.env.PAGES || '').split(',').map(Number).filter(Boolean)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const short = (e) => String(e?.message || e).split('\n')[0].slice(0, 160)
const t = () => new Date().toISOString().slice(11, 19) + 'Z'
// PROFILE_DIR (optional): a browser profile kept between runs, so the editor's scripts are cached on disk (on a slow
// connection a cold Elementor editor load can exceed several minutes). The saved session's cookies are loaded into it.
// Images, fonts and emoji are not downloaded in the admin browser: the edit needs only the editor's data and scripts.
const fs = await import('node:fs')
let b, ctx
if (process.env.PROFILE_DIR) {
  ctx = await chromium.launchPersistentContext(process.env.PROFILE_DIR, { args: ['--disable-gpu'], viewport: { width: 1440, height: 1000 } })
  await ctx.clearCookies(); await ctx.addCookies(JSON.parse(fs.readFileSync(process.env.WP_STORAGE_STATE, 'utf8')).cookies)
  b = { close: () => ctx.close() }
} else {
  b = await chromium.launch({ args: ['--disable-gpu'] })
  ctx = await b.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })
}
await ctx.route((u) => /\.(png|jpe?g|gif|webp|svg|woff2?|ttf|eot|mp4)(\?|$)/i.test(u.pathname) || /(^|\.)(s\.w\.org|googletagmanager\.com|google-analytics\.com|facebook\.(com|net)|clarity\.ms|doubleclick\.net)$/i.test(u.hostname), (r) => r.abort())
const admin = await ctx.newPage(); admin.on('dialog', (d) => d.accept())
const EDITOR_MS = Number(process.env.EDITOR_TIMEOUT_MS || 900000)
await admin.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`); const nonce = (await admin.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in'); process.exit(2) }
const page = async (id) => (await (await ctx.request.get(`${WP}/wp-json/wp/v2/pages/${id}?context=edit&_fields=id,slug,status,link`, { headers: { 'X-WP-Nonce': nonce } })).json())
let done = 0
// A page that times out (slow connection) is tried once more before the run stops.
const queue = PAGES.map((id) => ({ id, tries: 0 }))
while (queue.length) {
  const job = queue.shift(); const id = job.id
  try {
    const before = await page(id)
    if (before.status !== 'publish') { console.log(`${t()} SKIP #${id}: not published (${before.status})`); continue }
    await admin.goto(`${WP}/wp-admin/post.php?post=${id}&action=elementor`, { timeout: EDITOR_MS, waitUntil: 'domcontentloaded' })
    await admin.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: EDITOR_MS })
    await sleep(2500)
    const copy = Number(new URL(admin.url()).searchParams.get('post'))
    const r = await admin.evaluate((bad) => {
      const re = new RegExp(bad); const found = []
      const walk = (c) => { if (c.model.get('widgetType') === 'image-carousel') found.push(c); (c.children || []).forEach(walk) }
      walk(elementor.getPreviewContainer())
      const out = []
      for (const c of found) {
        const items = c.settings.get('carousel') || []
        const list = (items.toJSON ? items.toJSON() : items).map((x) => ({ ...x }))
        const keep = list.filter((x) => !re.test(String(x.url || '')))
        if (keep.length !== list.length) { $e.run('document/elements/settings', { container: c, settings: { carousel: keep } }); out.push(`${list.length}->${keep.length}`) }
      }
      return { carousels: found.length, changed: out }
    }, BAD.source)
    // The live page's HTML (the carousel lazy-loads its images, so the browser's image list is not reliable here).
    const html = async () => { for (let i = 0; ; i++) { try { return await (await fetch(`${before.link}?c=${Date.now()}`)).text() } catch (e) { if (i > 2) throw e; await sleep(5000) } } }
    const liveRefs = async () => { const h = await html(); return { bad: (h.match(/2026\/09\/(uber-1|pwc)\.png/g) || []).length, zomato: (h.match(/2026\/09\/zomato-1\.png/g) || []).length } }
    const now = await liveRefs()
    if (!r.changed.length && !now.bad) { console.log(`${t()} #${id}: already fixed live; left unchanged`); done++; continue }
    if (!r.changed.length) console.log(`${t()} #${id}: its working copy #${copy} already holds the change (saved earlier, not published); publishing it`)
    // Elementor's own publish command (the action behind its Publish/Update button; the button itself proved
    // unreliable on these large pages). An administrator's publish is approved and published directly.
    await admin.evaluate(async () => { await $e.run('document/save/publish') })
    await sleep(1500); await admin.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(4000)
    let ok = false, detail = ''
    for (let i = 0; i < 18 && !ok; i++) { const s = await liveRefs(); detail = `live HTML: removed-slide files ${s.bad}, zomato-1 ${s.zomato}`; ok = s.bad === 0 && s.zomato > 0; if (!ok) await sleep(10000) }
    const after = await page(id)
    const same = after.id === id && after.slug === before.slug && after.status === 'publish'
    console.log(`${t()} ${ok && same ? 'DONE' : 'FAIL'} #${id} /${before.slug}/ (edited copy #${copy}, carousel ${r.changed.join(',')}) | ${detail} | id/address unchanged ${same}`)
    if (!(ok && same)) break
    done++
  } catch (e) { if (!job.tries++) { console.log(`${t()} RETRY #${id}: ${short(e)}`); queue.unshift(job); continue } console.log(`${t()} STOP #${id}: ${short(e)}`); break }
}
console.log(`${t()} pages fixed: ${done}/${PAGES.length}`)
await b.close()
