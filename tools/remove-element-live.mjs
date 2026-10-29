// Production content fix: remove ONE Elementor element from a live page through the normal workflow (the page opens
// in Elementor as its working copy; the element is deleted with Elementor's own command; the administrator's publish
// publishes it). Guards: the element must exist and match EXPECT (widget type and a setting substring); the working
// copy must hold no unpublished changes (plugin 0.7.11 status); the page must stay Published at the same address;
// every other element on the live page must still be there. Prints no cookie or nonce; errors are one line.
//
//   WP_STORAGE_STATE=<session.json> PAGE=733 ELEMENT=dcb0167 EXPECT='image|"id":743' node tools/remove-element-live.mjs
// Rollback: Approvals & Publishing -> Recent publications -> Restore on the page.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const WP = 'https://enroll.acadvizen.com'
const PAGE = Number(process.env.PAGE), ELEMENT = String(process.env.ELEMENT || ''), [TYPE, NEEDLE] = String(process.env.EXPECT || '|').split('|')
const fl = (e) => String(e?.message || e).split('\n')[0].slice(0, 200)
process.on('uncaughtException', (e) => { console.log(`STOP: ${fl(e)}`); process.exit(1) })
process.on('unhandledRejection', (e) => { console.log(`STOP: ${fl(e)}`); process.exit(1) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const t = () => new Date().toISOString().slice(11, 19) + 'Z'
const ids = (h) => [...new Set([...h.matchAll(/data-id="([0-9a-f]{7,})"/g)].map((m) => m[1]))]
const live = async (url) => { for (let i = 0; i < 4; i++) { try { return await (await fetch(`${url}?acvrm=${Date.now()}`, { signal: AbortSignal.timeout(120000) })).text() } catch { await sleep(5000) } } return '' }
const b = await chromium.launch({ args: ['--disable-gpu'] }); const ctx = await b.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } }); const admin = await ctx.newPage()
await admin.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`, { timeout: 180000 }); const nonce = (await admin.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in'); process.exit(2) }
const rest = async (route) => (await (await ctx.request.get(`${WP}/wp-json/${route}`, { headers: { 'X-WP-Nonce': nonce }, timeout: 180000 })).json())
const before = await rest(`wp/v2/pages/${PAGE}?context=edit&_fields=id,slug,status,link,title`)
if (before.status !== 'publish') { console.log(`STOP: #${PAGE} is ${before.status}`); process.exit(1) }
const html0 = await live(before.link); const ids0 = ids(html0)
console.log(`${t()} #${PAGE} "${before.title.raw}" /${before.slug}/ live elements ${ids0.length}, element ${ELEMENT} present ${ids0.includes(ELEMENT)}`)
await admin.goto(`${WP}/wp-admin/post.php?post=${PAGE}&action=elementor`, { timeout: 480000, waitUntil: 'domcontentloaded' })
await admin.waitForFunction(() => window.elementor && window.$e && elementor.documents?.getCurrent?.() && elementor.getPreviewContainer?.(), null, { timeout: 480000 }); await sleep(3000)
const copy = Number(new URL(admin.url()).searchParams.get('post'))
const standing = await rest(`acadvizen-cms/v1/working-copy/${copy}`)
if (!standing.is_copy || standing.live !== 'published' || standing.changes) { console.log(`STOP: working copy #${copy} ${JSON.stringify(standing).slice(0, 160)} (unpublished changes or not a copy of the live page)`); process.exit(1) }
const found = await admin.evaluate(({ id }) => { const c = elementor.getContainer(id); return c ? { type: c.model.get('widgetType') || c.model.get('elType'), settings: JSON.stringify(c.settings.toJSON()), parent: c.parent?.id, siblings: (c.parent?.children || []).length } : null }, { id: ELEMENT })
if (!found || found.type !== TYPE || !found.settings.includes(NEEDLE)) { console.log(`STOP: element ${ELEMENT} is ${JSON.stringify(found).slice(0, 200)}; expected ${TYPE} with ${NEEDLE}`); process.exit(1) }
console.log(`${t()} working copy #${copy}: no unpublished changes; element ${ELEMENT} = ${found.type} in ${found.parent} (${found.siblings} element(s) there)`)
await admin.evaluate(({ id }) => { $e.run('document/elements/delete', { container: elementor.getContainer(id) }) }, { id: ELEMENT })
await Promise.race([admin.evaluate(async () => { await $e.run('document/save/publish') }), sleep(180000).then(() => { throw new Error('save did not finish within 3 minutes') })])
await sleep(1500); await admin.waitForFunction(() => !elementor.saver.isSaving, null, { timeout: 180000 }); await sleep(5000)
let html = '', ok = false
for (let i = 0; i < 12 && !ok; i++) { html = await live(before.link); ok = html.length > 10000 && !ids(html).includes(ELEMENT); if (!ok) await sleep(10000) }
const after = await rest(`wp/v2/pages/${PAGE}?context=edit&_fields=id,slug,status,title`)
const ids1 = ids(html); const lost = ids0.filter((x) => x !== ELEMENT && !ids1.includes(x)), added = ids1.filter((x) => !ids0.includes(x))
console.log(`${t()} ${ok && after.status === 'publish' && after.slug === before.slug && !lost.length ? 'DONE' : 'FAIL'} #${PAGE}: element ${ELEMENT} on live ${ids1.includes(ELEMENT)} | status ${after.status} | address unchanged ${after.slug === before.slug} | title "${after.title.raw}" | other elements lost ${lost.length}${lost.length ? ' ' + lost.join(',') : ''} | added ${added.length}`)
await b.close()
