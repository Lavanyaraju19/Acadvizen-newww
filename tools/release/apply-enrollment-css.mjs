// Adds (or removes) the Enrollment responsive fix in Appearance → Customize → Additional CSS of the live
// Enrollment WordPress, through its own Customizer, signed in with a saved wp-admin session.
//
//   node tools/release/apply-enrollment-css.mjs <session.json>           add or replace the fix
//   node tools/release/apply-enrollment-css.mjs <session.json> --undo    remove the fix
//
// Only the block between "/* ACADVIZEN-RESPONSIVE-FIX start */" and "... end */" is touched; any other
// Additional CSS stays as it is. The CSS before the change is saved first to
// ~/acadvizen-release/enrollment-css-<UTC time>/additional-css-before.css. Afterwards the public homepage
// is checked: the fix is present (or gone), and at 1440/1024/768/390 px the page is no wider than the
// window and cannot be shifted sideways. Prints no cookie or credential.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)('playwright')
const [session, mode] = process.argv.slice(2)
if (!session || !fs.existsSync(session)) { console.log('usage: node tools/release/apply-enrollment-css.mjs <session.json> [--undo]'); process.exit(2) }
const SITE = 'https://enroll.acadvizen.com'
const START = '/* ACADVIZEN-RESPONSIVE-FIX start */', END = '/* ACADVIZEN-RESPONSIVE-FIX end */'
const FIX = fs.readFileSync(new URL('../../wordpress/enrollment/responsive-fix.css', import.meta.url), 'utf8').trim()
const OUT = path.join(os.homedir(), 'acadvizen-release', `enrollment-css-${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}Z`)
fs.mkdirSync(OUT, { recursive: true })
const TRACKING = /googletagmanager|google-analytics|facebook|clarity|hotjar|doubleclick/

const browser = await chromium.launch()
const page = await (await browser.newContext({ storageState: session, viewport: { width: 1400, height: 900 } })).newPage()
await page.goto(`${SITE}/wp-admin/customize.php`, { waitUntil: 'domcontentloaded', timeout: 240000 })
await page.waitForFunction(() => window.wp?.customize?.settings?.theme && wp.customize.state?.('saved'), null, { timeout: 240000 })
const id = await page.evaluate(() => `custom_css[${wp.customize.settings.theme.stylesheet}]`)
const current = await page.evaluate((id) => (wp.customize(id) ? wp.customize(id).get() : null), id)
if (current === null) { console.log(`STOP: Additional CSS setting ${id} not found; nothing changed`); process.exit(1) }
fs.writeFileSync(path.join(OUT, 'additional-css-before.css'), current)
const others = current.includes(START) && current.includes(END) ? (current.slice(0, current.indexOf(START)) + current.slice(current.indexOf(END) + END.length)).replace(/\n{3,}/g, '\n\n').trim() : current.trim()
const next = mode === '--undo' ? `${others}\n` : `${others ? `${others}\n\n` : ''}${START}\n${FIX}\n${END}\n`
await page.evaluate(({ id, next }) => wp.customize(id).set(next), { id, next })
await page.evaluate(() => new Promise((resolve, reject) => { wp.customize.previewer.save().done(resolve).fail((e) => reject(new Error(JSON.stringify(e).slice(0, 200)))) }))
await page.waitForFunction(() => wp.customize.state('saved').get(), null, { timeout: 120000 })
console.log(`saved: Additional CSS ${current.length} → ${next.length} characters (${mode === '--undo' ? 'fix removed' : 'fix added'}); other CSS kept: ${others.length} characters. Backup: ${OUT}`)

let ok = true
for (const W of [1440, 1024, 768, 390]) {
  const p = await (await browser.newContext({ viewport: { width: W, height: 900 } })).newPage()
  await p.route((u) => TRACKING.test(u.hostname), (r) => r.abort())
  await p.goto(`${SITE}/?acvcss=${Date.now()}`, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(2500)
  const r = await p.evaluate(() => { const before = scrollX; scrollTo(500, scrollY); const forced = scrollX; scrollTo(0, scrollY); return { has: (document.getElementById('wp-custom-css')?.textContent || '').includes('ACADVIZEN-RESPONSIVE-FIX'), sw: document.documentElement.scrollWidth, before, forced } })
  const fine = mode === '--undo' ? !r.has : r.has && r.before === 0 && r.forced === 0
  if (!fine) ok = false
  console.log(`${fine ? 'PASS' : 'FAIL'} @${W}: fix on the page: ${r.has} | sideways offset at load ${r.before}, after a forced sideways scroll ${r.forced} | page width ${r.sw}`)
  await p.screenshot({ path: path.join(OUT, `home-${W}.png`) }).catch(() => {})
  await p.context().close()
}
await browser.close()
console.log(ok ? 'DONE' : 'CHECK FAILED: undo with --undo if needed')
process.exitCode = ok ? 0 : 1
