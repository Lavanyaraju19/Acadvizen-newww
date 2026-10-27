// Live acceptance of navigation editing (client demo #14), harmless and reversible: on Appearance -> Menus, the Main
// Website Menu's "Contact" item gets a Title Attribute (hover text, no visible text change), the menu is saved, the
// Main pages are redrawn with it; then the attribute is cleared and saved again, and the menu must be exactly as
// before (every field of every item) and the Main pages back to their original link. The Enrollment menus are not
// touched. Prints no credential or cookie.
//
//   WP_STORAGE_STATE=<session.json> node tools/verify-navigation-live.mjs
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)('playwright')
const WP = 'https://enroll.acadvizen.com', MAIN = 'https://www.acadvizen.com'
const MENU_NAME = 'Main Website Menu', ITEM_TITLE = 'Contact', HOVER = 'Contact Acadvizen'
const PAGES = ['/', '/about', '/blog', '/digital-marketing-course-in-btm-layout']
const OUT = process.env.EVIDENCE_DIR || path.join(process.cwd(), 'navigation-live-evidence'); fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${new Date().toISOString().slice(11, 19)}Z ${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const info = (m) => console.log(`${new Date().toISOString().slice(11, 19)}Z INFO ${m}`)
// The Contact link in the page's header navigation, and whether it carries the hover text.
const contactLinks = (html) => [...html.matchAll(/<a\b[^>]*href="[^"]*\/contact\/?"[^>]*>/g)].map((m) => m[0])
const hasHover = (html) => contactLinks(html).some((a) => a.includes(`title="${HOVER}"`))
const read = async (p) => { const r = await fetch(`${MAIN}${p}${p.includes('?') ? '&' : '?'}navcheck=${Date.now()}`); return { status: r.status, html: await r.text() } }
const until = async (pred, ms) => { const t0 = Date.now(); let last; while (Date.now() - t0 < ms) { last = await Promise.all(PAGES.map(read)); if (pred(last)) return { ok: true, s: Math.round((Date.now() - t0) / 1000), last }; await sleep(30000) } return { ok: false, s: Math.round((Date.now() - t0) / 1000), last } }

const browser = await chromium.launch({ args: ['--disable-gpu'] })
const ctx = await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
await page.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)
const nonce = (await page.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in to wp-admin'); process.exit(2) }
const rest = async (route) => { const r = await ctx.request.get(`${WP}/wp-json/${route}`, { headers: { 'X-WP-Nonce': nonce } }); return r.json() }
const FIELDS = ['id', 'title', 'url', 'attr_title', 'description', 'type', 'type_label', 'object', 'object_id', 'parent', 'menu_order', 'target', 'classes', 'xfn', 'status', 'menus']
const snapshot = async (menuId) => (await rest(`wp/v2/menu-items?menus=${menuId}&per_page=100&context=edit`)).map((i) => Object.fromEntries(FIELDS.map((f) => [f, f === 'title' ? i.title?.raw : i[f]])))
const menu = (await rest('wp/v2/menus?per_page=100')).find((m) => m.name === MENU_NAME)
if (!menu) { console.log(`STOP: "${MENU_NAME}" not found`); process.exit(2) }
const before = await snapshot(menu.id)
fs.writeFileSync(path.join(OUT, 'menu-before.json'), JSON.stringify(before, null, 1))
const item = before.find((i) => i.title === ITEM_TITLE && i.parent === 0)
if (!item || item.attr_title) { console.log(`STOP: "${ITEM_TITLE}" item not found, or it already has a title attribute`); process.exit(2) }
const enrollBefore = (await (await fetch(`${WP}/?navcheck=${Date.now()}`)).text()).includes(HOVER)

// Appearance -> Menus, as an administrator does it: the item's "Title Attribute" field (part of the form even while
// Screen Options hides it), then Save Menu. No click on overlaid controls: they timed out on 26 Oct.
async function setHover(value) {
  await page.goto(`${WP}/wp-admin/nav-menus.php?action=edit&menu=${menu.id}`, { timeout: 300000 })
  await page.locator(`#edit-menu-item-attr-title-${item.id}`).evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })) }, value)
  await page.screenshot({ path: path.join(OUT, `menus-${value ? 'set' : 'cleared'}.png`) }).catch(() => {})
  await Promise.all([page.waitForNavigation({ timeout: 300000 }), page.locator('#update-nav-menu').evaluate((f) => f.requestSubmit(f.querySelector('#save_menu_footer') || f.querySelector('#save_menu_header')))])
  // WordPress' own confirmation ("… has been updated."), not other notices such as "an update is available".
  return (await page.locator('#message.updated, .notice-success, .updated').filter({ hasText: /updated/i }).first().innerText().catch(() => '')).replace(/s+/g, ' ').slice(0, 120)
}
// Fallback when the menu screen cannot be used: WordPress' own menu-item endpoint.
const restoreByApi = () => ctx.request.post(`${WP}/wp-json/wp/v2/menu-items/${item.id}`, { headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: JSON.stringify({ attr_title: item.attr_title || '' }) })

try {
  const start = await Promise.all(PAGES.map(read))
  check('1 before: the Main pages answer 200 and the Contact link has no hover text', start.every((r) => r.status === 200 && contactLinks(r.html).length && !hasHover(r.html)), start.map((r, i) => `${PAGES[i]} ${r.status} links:${contactLinks(r.html).length}`).join(' | '))
  const saved = await setHover(HOVER)
  check('2 Appearance -> Menus: title attribute set on "Contact" and the menu saved', /updated/i.test(saved), saved)
  const on = await until((rs) => rs.every((r) => r.status === 200 && hasHover(r.html)), 120 * 60000)
  check('3 the change is live on every Main page checked (header navigation redrawn)', on.ok, `${on.s}s | ${PAGES.join(', ')}`)
  const enrollDuring = (await (await fetch(`${WP}/?navcheck=${Date.now()}`)).text()).includes(HOVER)
  check('3 the Enrollment website is not affected (Main menu only)', !enrollBefore && !enrollDuring)
} catch (e) {
  check('run finished without an error', false, String(e.message || e).slice(0, 300))
} finally {
  // Always back to the original: the attribute cleared, the menu saved, the screen option as it was.
  try {
    const cleared = await setHover('').catch(async (e) => { info(`menu screen restore failed (${String(e.message).slice(0, 80)}); restoring through the menu-item endpoint`); const r = await restoreByApi(); return r.status() === 200 ? 'updated (API)' : `HTTP ${r.status()}` })
    check('4 restore: the title attribute cleared and the menu saved', /updated/i.test(cleared), cleared)
    const after = await snapshot(menu.id)
    fs.writeFileSync(path.join(OUT, 'menu-after.json'), JSON.stringify(after, null, 1))
    check('5 the menu is exactly as before (every field of every item)', JSON.stringify(after) === JSON.stringify(before), `${after.length} items`)
    const off = await until((rs) => rs.every((r) => r.status === 200 && contactLinks(r.html).length && !hasHover(r.html)), 120 * 60000)
    check('6 every Main page checked is back to its original link', off.ok, `${off.s}s`)
  } catch (e) {
    check('restore finished without an error', false, String(e.message || e).slice(0, 300))
  }
  await browser.close()
}
const failed = results.filter((x) => !x).length
console.log(`\n${results.length - failed} passed, ${failed} failed [LIVE]`)
process.exit(failed ? 1 : 0)
