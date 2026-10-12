// Live check of publishing from the Enrollment WordPress admin (Acadvizen Master Admin) to Main only,
// Enrollment only and Both, with ONE disposable, labelled, noindex test blog that is trashed and
// deleted through the same admin screens at the end. Run after the plugin is installed, the shared
// secret is set on both sides and Main has been redeployed:
//   node tools/verify-wordpress-live.mjs
// Sign-in: WP_PROD_USER / WP_PROD_PASS from ~/.acadvizen-production.env (or WP_USER / WP_PASS).
// Override the addresses with WP_URL and MAIN_URL. Prints no credential. No enquiry is sent.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const file = path.join(os.homedir(), '.acadvizen-production.env')
const env = fs.existsSync(file)
  ? Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)='?(.*?)'?$/)).filter(Boolean).map((m) => [m[1], m[2]]))
  : {}
process.env.WP_URL ||= 'https://enroll.acadvizen.com'
process.env.MAIN_URL ||= 'https://www.acadvizen.com'
const USER = process.env.WP_USER || env.WP_PROD_USER || ''
const PASS = process.env.WP_PASS || env.WP_PROD_PASS || ''
const { WP, MAIN, T, screen, get, launch, login, saveForm, notice, removeEnrollmentCopies, enrollmentCopiesLeft } = await import('../tests/wordpress/acceptanceKit.mjs')
const LEVEL = /localhost|127\.0\.0\.1/.test(`${WP} ${MAIN}`) ? 'LOCAL' : 'PRODUCTION'

let pass = 0
let fail = 0
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} [${LEVEL}] ${name}${detail ? ` — ${detail}` : ''}`)
}
// Every Enrollment request is recorded (status, cache headers) so a delay can be diagnosed.
const enrollLog = []
const enrollStatus = async (slug) => {
  const r = await fetch(`${WP}/${slug}/?t=${Date.now()}`, { redirect: 'manual' })
  const cache = ['x-litespeed-cache', 'x-hcdn-cache-status', 'cf-cache-status', 'x-cache'].map((h) => r.headers.get(h) && `${h}=${r.headers.get(h)}`).filter(Boolean).join(' ')
  enrollLog.push(`${new Date().toISOString().slice(11, 19)}Z ${r.status}${r.headers.get('location') ? ` → ${r.headers.get('location')}` : ''}${cache ? ` ${cache}` : ''}`)
  return r.status
}
// Waits up to ~2 minutes for Enrollment and reports how long it took.
async function enrollEventually(expected) {
  const started = Date.now()
  for (let i = 0; i < 40; i++) {
    if ((await enrollStatus(SLUG)) === expected) return { ok: true, seconds: Math.round((Date.now() - started) / 1000) }
    await new Promise((r) => setTimeout(r, 3000))
  }
  return { ok: false, seconds: Math.round((Date.now() - started) / 1000) }
}
async function eventually(fn, tries = 8) {
  let last
  for (let i = 0; i < tries; i++) {
    last = await fn()
    if (last === true) return true
    await new Promise((r) => setTimeout(r, 2000))
  }
  return last
}

// What the form is about to send, and the Enrollment copy's real WordPress status (read-only REST).
const formState = async (page) => `target=${await page.inputValue('[name="acv_target"]').catch(() => '?')} status=${await page.inputValue('#acv-status').catch(() => '?')}`
async function copyStatus(page, slug) {
  const probe = await page.context().newPage()
  try {
    await probe.goto(`${WP}/wp-admin/index.php`, { waitUntil: 'domcontentloaded', timeout: 120000 })
    const nonce = await probe.evaluate(() => window.wpApiSettings?.nonce || '')
    const posts = await probe.evaluate(async ({ n, s }) => (await fetch(`/wp-json/wp/v2/posts?slug=${s}&status=publish,draft,pending,private,future&context=edit&_fields=status`, { headers: { 'X-WP-Nonce': n } })).json(), { n: nonce, s: slug })
    return Array.isArray(posts) ? posts.map((x) => x.status).join(',') || 'no copy' : 'unknown'
  } catch { return 'unknown' } finally { await probe.close() }
}

// Preconditions: Main's API on, the plugin version of this repository, a working administrator sign-in.
const EXPECTED_VERSION = (fs.readFileSync(new URL('../wordpress/acadvizen-cms/acadvizen-cms.php', import.meta.url), 'utf8').match(/const VERSION\s*=\s*'([^']+)'/) || [])[1] || '?'
const apiState = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', body: '{}' })
if (apiState.status === 503) { console.log(`[${LEVEL}] Main's content API is still off (503). Redeploy Main after setting the variables.`); process.exit(2) }
const readme = await (await fetch(`${WP}/wp-content/plugins/acadvizen-cms/readme.txt?t=${Date.now()}`)).text()
const version = readme.match(/Stable tag:\s*([\d.]+)/i)?.[1] || 'unknown'
check(`plugin ${EXPECTED_VERSION} (this repository) is installed on the WordPress site`, version === EXPECTED_VERSION, `found ${version}`)
if (!process.env.WP_STORAGE_STATE && (!USER || !PASS)) { console.log('No WordPress sign-in found (WP_STORAGE_STATE, or WP_PROD_USER / WP_PROD_PASS).'); process.exit(2) }
const homeBefore = await fetch(`${WP}/?t=${Date.now()}`)
const homeBeforeHtml = await homeBefore.text()

const { browser } = await launch()
// A saved WordPress session (WP_STORAGE_STATE) avoids a new sign-in; otherwise one sign-in attempt.
let admin
if (process.env.WP_STORAGE_STATE) {
  admin = await (await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1100 } })).newPage()
  admin.on('dialog', (d) => d.accept())
  const goto = admin.goto.bind(admin)
  admin.goto = (url, options = {}) => goto(url, { waitUntil: 'domcontentloaded', timeout: 120000, ...options })
  await admin.goto(`${WP}/wp-admin/`)
} else {
  admin = await login(browser, USER, PASS)
}
const signedIn = new URL(admin.url()).pathname.startsWith('/wp-admin')
check('administrator signed in', signedIn)
if (!signedIn) { await browser.close(); process.exit(1) }

const SLUG = `cms-production-test-blog-${T}`
const TITLE = `CMS PRODUCTION TEST blog ${T}`
let blogId = ''
try {
  await admin.goto(screen('pages'))
  const rows = await admin.locator('.acv-main-table tbody tr').count()
  check('Main Website screen lists the live Main pages', rows > 0, `${rows} rows (${await notice(admin) || 'no error'})`)

  await admin.goto(screen('blogs', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', TITLE)
  await admin.fill('[name="acv_field[slug]"]', SLUG)
  await admin.fill('[name="acv_field[description]"]', 'Disposable production test article; removed after the check.')
  await admin.locator('[name="acv_field[noindex]"]').check()
  await admin.locator('#acv-blocks .acv-add-row button', { hasText: 'Heading' }).click()
  await admin.locator('#acv-blocks .acv-card').nth(0).getByLabel('Text').fill(`Heading ${T}`)

  // Main only
  await admin.selectOption('[name="acv_target"]', 'main')
  await admin.selectOption('#acv-status', 'published')
  const saved = await saveForm(admin)
  blogId = new URL(admin.url()).searchParams.get('id') || ''
  const mainOk = await eventually(async () => { const p = await get(`/blog/${SLUG}`); return p.status === 200 && p.html.includes(`Heading ${T}`) })
  check('Main only: public on the Main website', mainOk === true, saved)
  check('Main only: not on the Enrollment website', (await enrollStatus(SLUG)) === 404)
  check('Main only: the test blog carries noindex', /<meta name="robots" content="noindex/.test((await get(`/blog/${SLUG}`)).html))

  // Enrollment only
  await admin.selectOption('[name="acv_target"]', 'enrollment')
  await admin.selectOption('#acv-status', 'published')
  const formE = await formState(admin)
  // Every form POST the browser sends during this save (count and the Target/Status values in each).
  const posts = []
  const onRequest = (r) => {
    if (r.method() !== 'POST' || !/wp-admin\/(admin-post|admin)\.php/.test(r.url())) return
    const data = r.postData() || ''
    const field = (name) => (data.match(new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n]*)`)) || data.match(new RegExp(`(?:^|&)${name}=([^&]*)`)) || [])[1] ?? 'absent'
    posts.push(`${new Date().toISOString().slice(11, 19)}Z target=${field('acv_target')} status=${field('acv_status')}`)
  }
  admin.on('request', onRequest)
  const savedE = await saveForm(admin)
  admin.off('request', onRequest)
  const copyE = await copyStatus(admin, SLUG)
  const enrollOnly = await enrollEventually(200)
  check('Enrollment only: public on the Enrollment website', enrollOnly.ok, `form [${formE}] | POSTs ${posts.length}: ${posts.join(' ; ')} | copy status ${copyE} | ${savedE} | after ${enrollOnly.seconds}s | ${enrollLog.slice(-3).join(' ; ')}`)
  check('Enrollment only: no longer public on Main', (await eventually(async () => (await get(`/blog/${SLUG}`)).status === 404)) === true)
  // Regression (found on production, fixed in plugin 0.6.1): the editor must show the article as
  // Published and saving again without touching Status must keep it live on Enrollment.
  await admin.goto(screen('blogs', `&view=edit&id=${blogId}`))
  const shownStatus = await admin.inputValue('#acv-status').catch(() => '?')
  await admin.locator('#acv-blocks .acv-card').nth(0).getByLabel('Text').fill(`Heading second save ${T}`)
  const savedAgain = await saveForm(admin)
  const stillLive = await enrollEventually(200)
  const updatedCopy = (await (await fetch(`${WP}/${SLUG}/?t=${Date.now()}`)).text()).includes(`Heading second save ${T}`)
  check('Enrollment only: the editor shows the live article as Published, and saving again keeps it live (with the edit)', shownStatus === 'published' && stillLive.ok && updatedCopy, `shown status ${shownStatus} | ${savedAgain} | copy status ${await copyStatus(admin, SLUG)}`)

  // Both
  await admin.selectOption('[name="acv_target"]', 'both')
  await admin.selectOption('#acv-status', 'published')
  const savedB = await saveForm(admin)
  const both = await eventually(async () => (await get(`/blog/${SLUG}`)).status === 200 && (await enrollStatus(SLUG)) === 200)
  check('Both: public on Main and on Enrollment', both === true, savedB)
  await admin.locator('#acv-blocks .acv-card').nth(0).getByLabel('Text').fill(`Heading edited ${T}`)
  await saveForm(admin)
  const edited = await eventually(async () => (await get(`/blog/${SLUG}`)).html.includes(`Heading edited ${T}`) && (await (await fetch(`${WP}/${SLUG}/?t=${Date.now()}`)).text()).includes(`Heading edited ${T}`))
  check('Both: an edit reaches both websites', edited === true)
} catch (error) {
  // Never let an unexpected error look like a pass (the exit in finally would otherwise hide it).
  check('run finished without an unexpected error', false, String(error.message || error).split(/\r?\n/)[0].slice(0, 200))
} finally {
  if (blogId) {
    // The admin's own links, followed directly (a click can stall in a headless browser).
    for (const [view, label] of [['', 'Trash'], ['&trashed=1', 'Delete permanently']]) {
      await admin.goto(screen('blogs', `${view}&s=${SLUG}`)).catch(() => {})
      const href = await admin.locator('.acv-main-table tr', { hasText: SLUG }).first().locator('a', { hasText: label }).getAttribute('href', { timeout: 15000 }).catch(() => '')
      if (href) await admin.goto(new URL(href, `${WP}/wp-admin/`).href).catch(() => {})
    }
  }
  // By design the plugin moves the Enrollment copy to WordPress's own trash; remove the test copy for good.
  const removedCopies = await removeEnrollmentCopies(admin, TITLE)
  const copiesLeft = await enrollmentCopiesLeft(admin, TITLE)
  check('cleanup: the Enrollment copy is deleted for good (not left in the WordPress trash)', copiesLeft === 0, `${removedCopies} removed, ${copiesLeft} left`)
  check('cleanup: gone from Main', (await eventually(async () => (await get(`/blog/${SLUG}`)).status === 404)) === true)
  check('cleanup: gone from Enrollment', (await eventually(async () => (await enrollStatus(SLUG)) === 404)) === true)
  await admin.goto(screen('blogs', '&trashed=1'))
  const leftTrash = await admin.locator('.acv-main-table tr', { hasText: SLUG }).count()
  await admin.goto(screen('blogs'))
  const leftLive = await admin.locator('.acv-main-table tr', { hasText: SLUG }).count()
  check('cleanup: no test blog left in the admin (list or trash)', leftTrash + leftLive === 0, `${leftLive} listed, ${leftTrash} in trash`)
  const homeAfter = await fetch(`${WP}/?t=${Date.now()}`)
  const homeAfterHtml = await homeAfter.text()
  check('the Elementor home page still answers 200 with its Elementor layout', homeAfter.status === 200 && homeBefore.status === 200 && /elementor/.test(homeAfterHtml) === /elementor/.test(homeBeforeHtml), `HTTP ${homeAfter.status}`)
  await browser.close()
  console.log(`\n${pass} passed, ${fail} failed [${LEVEL}] | test blog /${SLUG}`)
  process.exit(fail ? 1 : 0)
}
