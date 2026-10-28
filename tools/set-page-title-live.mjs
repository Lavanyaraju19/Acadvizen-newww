// Production content fix: give a live page back its title through the normal workflow. The page opens in Elementor
// (its working copy), the title is set in Elementor's page settings, the administrator's publish publishes it, and the
// live page is checked. Refuses when the page's working copy holds unpublished changes (someone else's work).
//
//   WP_STORAGE_STATE=<session.json> TITLES='723=Mentors,971=Career' node tools/set-page-title-live.mjs
// Rollback: Approvals -> Recent publications -> Restore. Prints no cookie or nonce.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const WP = 'https://enroll.acadvizen.com'
const JOBS = String(process.env.TITLES || '').split(',').filter(Boolean).map((x) => { const [id, ...t] = x.split('='); return { id: Number(id), title: t.join('=') } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const t = () => new Date().toISOString().slice(11, 19) + 'Z'
const short = (e) => String(e?.message || e).split('\n')[0].slice(0, 140)
const b = await chromium.launch({ args: ['--disable-gpu'] }); const ctx = await b.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } }); const admin = await ctx.newPage()
await admin.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`); const nonce = (await admin.locator('body').innerText()).trim()
const page = async (id) => (await (await ctx.request.get(`${WP}/wp-json/wp/v2/pages/${id}?context=edit&_fields=id,slug,status,link,title,modified_gmt`, { headers: { 'X-WP-Nonce': nonce } })).json())
for (const job of JOBS) {
  try {
    const before = await page(job.id)
    if (before.status !== 'publish') { console.log(`${t()} SKIP #${job.id}: not published`); continue }
    await admin.goto(`${WP}/wp-admin/post.php?post=${job.id}&action=elementor`, { timeout: 480000, waitUntil: 'domcontentloaded' })
    await admin.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 480000 }); await sleep(2500)
    const copy = Number(new URL(admin.url()).searchParams.get('post'))
    const c = await page(copy)
    if (c.modified_gmt > before.modified_gmt && Date.parse(c.modified_gmt + 'Z') < Date.now() - 10 * 60000) { console.log(`${t()} SKIP #${job.id}: its working copy #${copy} was edited after the live page (someone's unpublished work)`); continue }
    await admin.evaluate((title) => { $e.run('document/elements/settings', { container: elementor.documents.getCurrent().container, settings: { post_title: title } }) }, job.title)
    await Promise.race([admin.evaluate(async () => { await $e.run('document/save/publish') }), sleep(180000).then(() => { throw new Error('save did not finish within 3 minutes') })])
    await sleep(1500); await admin.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(4000)
    let after; for (let i = 0; i < 12; i++) { after = await page(job.id); if (after.title.raw === job.title) break; await sleep(10000) }
    const h = await (await fetch(`${before.link}?tt=${Date.now()}`)).text(); const tag = (h.match(/<title>([^<]*)/) || [])[1] || ''
    console.log(`${t()} ${after.title.raw === job.title && after.slug === before.slug ? 'DONE' : 'FAIL'} #${job.id} /${before.slug}/ "${before.title.raw}" -> "${after.title.raw}" (copy #${copy}) | address unchanged ${after.slug === before.slug} | live <title> "${tag}"`)
  } catch (e) { console.log(`${t()} FAIL #${job.id}: ${short(e)}`) }
}
await b.close()
