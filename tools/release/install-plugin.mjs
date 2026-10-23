#!/usr/bin/env node
/**
 * Installs one reviewed Acadvizen Master Admin package on the production Enrollment WordPress
 * (enroll.acadvizen.com), through wp-admin's own "Upload Plugin → Replace current with uploaded", with an
 * automatic way back. Uses a saved wp-admin session (the owner's own sign-in); no password is read.
 *
 *   node tools/release/install-plugin.mjs --session <storageState.json>            install the release in plugin-release.json
 *   node tools/release/install-plugin.mjs --session <storageState.json> --undo     reinstall its rollback package
 *
 * tools/release/plugin-release.json: release {zip, sha256, version} and rollback {zip, sha256, version}.
 * In order (it stops at the first problem; nothing on the server is touched before step 3):
 *   1. the package's sha256 and the version inside it (readme.txt "Stable tag") match plugin-release.json;
 *   2. the Plugins screen lists Acadvizen Master Admin active at the rollback version; every plugin's name,
 *      version and active state is recorded;
 *   3. uploads the package and confirms "Replace current with uploaded";
 *   4. checks: Master Admin active at the release version; every other plugin unchanged; public readme.txt
 *      shows the release version; anonymous /manifest and /render answer 401 no-cache; the enquiry route
 *      acadvizen/v1/enquiry is still registered; the Enrollment home page answers 200 with the same Elementor
 *      documents (header, footer, page, popups) as before the install.
 *      Any failure: reinstalls the rollback package the same way and checks it.
 * Prints no secret or cookie. Output: ~/acadvizen-release/plugin-<UTC time>/.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..')
const { chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright')
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []))
const WP = 'https://enroll.acadvizen.com'
const NAME = 'Acadvizen Master Admin'
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/release/plugin-release.json'), 'utf8'))
const OUT = path.join(os.homedir(), 'acadvizen-release', `plugin-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 13)}Z`)
fs.mkdirSync(OUT, { recursive: true })
const log = (m) => { const line = `[${new Date().toISOString().slice(11, 19)}Z] ${m}`; console.log(line); fs.appendFileSync(path.join(OUT, 'log.txt'), line + '\n') }
const stop = (m) => { log(`STOP: ${m}`); process.exit(1) }

if (!args.session || !fs.existsSync(String(args.session))) stop('--session <storageState.json> is required (the owner\'s saved wp-admin sign-in)')
const [target, fallback] = args.undo ? [cfg.rollback, cfg.release] : [cfg.release, cfg.rollback]

/** 1. The package is exactly the reviewed one. */
function checkPackage(pkg) {
  const zip = path.join(ROOT, pkg.zip)
  if (!fs.existsSync(zip)) stop(`package missing: ${pkg.zip}`)
  const sha = crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex')
  if (sha !== pkg.sha256) stop(`sha256 of ${pkg.zip} is ${sha}, expected ${pkg.sha256}`)
  const readme = execFileSync('unzip', ['-p', zip, 'acadvizen-cms/readme.txt'], { encoding: 'utf8' })
  const tag = (readme.match(/^Stable tag:\s*(\S+)/m) || [])[1]
  if (tag !== pkg.version) stop(`${pkg.zip} contains version ${tag}, expected ${pkg.version}`)
  return zip
}
const zip = checkPackage(target)
checkPackage(fallback)
log(`package ${target.zip} sha256 ${target.sha256.slice(0, 12)}… version ${target.version} (way back: ${fallback.version})`)

const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: String(args.session), viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept())
const open = async (url) => { for (let i = 1; ; i++) { try { return await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 }) } catch (e) { if (i >= 3) throw e; log(`slow page, retry ${i}`) } } }
async function plugins() {
  await open(`${WP}/wp-admin/plugins.php?plugin_status=all`)
  if (/wp-login\.php/.test(page.url())) stop('the saved wp-admin session has expired: the owner signs in again first')
  // Only real plugin rows: a plugin with an update or notice has a second row with the same data-plugin and no name
  // (22 Oct 2026: 10 such rows were read as "changed" plugins).
  return page.$$eval('tr[data-plugin]', (trs) => trs.filter((t) => t.querySelector('.plugin-title strong')).map((t) => ({ file: t.getAttribute('data-plugin'), name: t.querySelector('.plugin-title strong')?.textContent.trim() || '', version: (t.querySelector('.plugin-version-author-uri')?.textContent.match(/Version ([^ |]+)/) || [])[1] || '', active: t.classList.contains('active') })))
}
const ours = (list) => list.find((p) => p.name === NAME)
/** The Elementor documents (header, footer, page, popups) on the Enrollment home page, as a visitor gets it. */
async function homeDocuments() {
  const r = await fetch(`${WP}/?nc=${Date.now()}`, { headers: { 'User-Agent': 'Mozilla/5.0 acadvizen-release-check' } })
  const html = await r.text()
  return { status: r.status, ids: [...new Set([...html.matchAll(/data-elementor-id="(\d+)"/g)].map((m) => m[1]))].sort() }
}

/** 2. Production is in the expected state. */
const before = await plugins()
fs.writeFileSync(path.join(OUT, 'plugins-before.json'), JSON.stringify(before, null, 1))
const cur = ours(before)
if (!cur || !cur.active) { await browser.close(); stop(`${NAME} is not active on production`) }
if (cur.version !== fallback.version && cur.version !== target.version) { await browser.close(); stop(`${NAME} is ${cur.version}; expected ${fallback.version}`) }
if (cur.version === target.version) { await browser.close(); log(`${NAME} is already ${target.version}; nothing to do`); process.exit(0) }
const homeBefore = await homeDocuments()
if (homeBefore.status !== 200 || !homeBefore.ids.length) { await browser.close(); stop(`Enrollment home answers ${homeBefore.status} with ${homeBefore.ids.length} Elementor documents`) }
log(`production: ${NAME} ${cur.version} active; ${before.length} plugins recorded; Enrollment home documents ${homeBefore.ids.join(',')}`)

/** 3. Upload and replace. */
async function install(file, version) {
  await open(`${WP}/wp-admin/plugin-install.php?tab=upload`)
  await page.setInputFiles('#pluginzip', file)
  // Submit WordPress's own upload form with its own button (a plain click timed out: the button was never reported
  // stable, 22 Oct 2026). Same form, same nonce, same request as clicking "Install Now".
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 300000 }), page.evaluate(() => { const b = document.querySelector('#install-plugin-submit'); b.form.requestSubmit(b) })])
  const replace = page.locator('a.update-from-upload-overwrite')
  await replace.waitFor({ timeout: 120000 })
  const text = (await page.locator('#wpbody-content').innerText()).replace(/\s+/g, ' ')
  fs.writeFileSync(path.join(OUT, `compare-${version}.txt`), text)
  if (!new RegExp(NAME).test(text)) stop('the upload screen does not compare Acadvizen Master Admin')
  // Open the button's own link (WordPress's signed "overwrite" action). 22 Oct 2026: a click on the button timed out
  // because it was never reported visible and stable; the link is the same action and nothing can cover it.
  const href = await replace.getAttribute('href')
  if (!href || !/action=upload-plugin/.test(href) || !/overwrite=(update|downgrade)-plugin(&|$)/.test(href)) stop(`unexpected "Replace current with uploaded" link: ${href}`)
  await open(new URL(href, `${WP}/wp-admin/`).toString())
  await page.waitForTimeout(3000)
  const result = (await page.locator('#wpbody-content').innerText()).replace(/\s+/g, ' ')
  fs.writeFileSync(path.join(OUT, `result-${version}.txt`), result)
  await page.screenshot({ path: path.join(OUT, `result-${version}.png`) }).catch(() => {})
  log(`upload ${version}: ${(result.match(/Plugin (updated|installed) successfully\.?|[^.]*error[^.]*\./i) || ['(no result line)'])[0]}`)
}

/** 4. Checks after the install. */
async function verify(version) {
  const after = await plugins()
  fs.writeFileSync(path.join(OUT, `plugins-after-${version}.json`), JSON.stringify(after, null, 1))
  const bad = []
  const o = ours(after)
  if (!o || !o.active || o.version !== version) bad.push(`${NAME} is ${o ? o.version + (o.active ? ' active' : ' INACTIVE') : 'missing'}`)
  for (const p of before.filter((x) => x.name !== NAME)) {
    const q = after.find((x) => x.file === p.file)
    if (!q || q.version !== p.version || q.active !== p.active) bad.push(`${p.name} changed: ${JSON.stringify(p)} -> ${JSON.stringify(q || null)}`)
  }
  const t = Date.now()
  const readme = await (await fetch(`${WP}/wp-content/plugins/acadvizen-cms/readme.txt?nc=${t}`)).text()
  if ((readme.match(/^Stable tag:\s*(\S+)/m) || [])[1] !== version) bad.push('public readme.txt does not show ' + version)
  for (const r of ['manifest', 'render?path=/']) {
    const res = await fetch(`${WP}/wp-json/acadvizen-cms/v1/${r}`)
    if (res.status !== 401 || !/no-cache|no-store/.test(res.headers.get('cache-control') || '')) bad.push(`anonymous /${r}: ${res.status} ${res.headers.get('cache-control')}`)
  }
  const ns = await (await fetch(`${WP}/wp-json/acadvizen/v1`)).json().catch(() => ({}))
  if (!Object.keys(ns.routes || {}).includes('/acadvizen/v1/enquiry')) bad.push('enquiry route acadvizen/v1/enquiry missing')
  const now = await homeDocuments()
  if (now.status !== 200 || now.ids.join(',') !== homeBefore.ids.join(',')) bad.push(`Enrollment home: ${now.status}, documents ${now.ids.join(',')} (before: ${homeBefore.ids.join(',')})`)
  return bad
}

let bad
try {
  await install(zip, target.version)
  bad = await verify(target.version)
} catch (e) {
  bad = [`install step failed: ${String(e.message).split(/\r?\n/)[0].slice(0, 200)}`]
}
if (!bad.length) {
  log(`PASS: ${NAME} ${target.version} active on production; other plugins unchanged; readme, signed routes (401 no-cache), enquiry route and Enrollment home checked`)
  log(`way back: node tools/release/install-plugin.mjs --session <session> --undo   (reinstalls ${fallback.version})`)
  await browser.close()
  process.exit(0)
}
log(`FAIL after install: ${bad.join(' | ')}`)
log(`going back to ${fallback.version}`)
await install(checkPackage(fallback), fallback.version)
bad = await verify(fallback.version)
log(bad.length ? `ROLLBACK CHECK FAILED: ${bad.join(' | ')}` : `rolled back: ${NAME} ${fallback.version} active again, checks pass`)
await browser.close()
process.exit(1)
