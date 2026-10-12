// Live check of publishing from the Enrollment WordPress admin (plugin 0.6.0) to Main only,
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
const { WP, MAIN, T, screen, get, launch, login, saveForm, follow, notice, removeEnrollmentCopies, enrollmentCopiesLeft } = await import('../tests/wordpress/acceptanceKit.mjs')
const LEVEL = /localhost|127\.0\.0\.1/.test(`${WP} ${MAIN}`) ? 'LOCAL' : 'PRODUCTION'

let pass = 0
let fail = 0
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} [${LEVEL}] ${name}${detail ? ` — ${detail}` : ''}`)
}
const enrollStatus = async (slug) => (await fetch(`${WP}/${slug}/?t=${Date.now()}`, { redirect: 'manual' })).status
async function eventually(fn, tries = 8) {
  let last
  for (let i = 0; i < tries; i++) {
    last = await fn()
    if (last === true) return true
    await new Promise((r) => setTimeout(r, 2000))
  }
  return last
}

// Preconditions: Main's API on, plugin 0.6.0, a working administrator sign-in.
const apiState = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', body: '{}' })
if (apiState.status === 503) { console.log(`[${LEVEL}] Main's content API is still off (503). Redeploy Main after setting the variables.`); process.exit(2) }
const readme = await (await fetch(`${WP}/wp-content/plugins/acadvizen-cms/readme.txt?t=${Date.now()}`)).text()
const version = readme.match(/Stable tag:\s*([\d.]+)/i)?.[1] || 'unknown'
check('plugin 0.6.0 is installed on the WordPress site', version === '0.6.0', `found ${version}`)
if (!USER || !PASS) { console.log('No WordPress sign-in found (WP_PROD_USER / WP_PROD_PASS).'); process.exit(2) }
const homeBefore = await fetch(`${WP}/?t=${Date.now()}`)
const homeBeforeHtml = await homeBefore.text()

const { browser } = await launch()
const admin = await login(browser, USER, PASS)
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
  const savedE = await saveForm(admin)
  check('Enrollment only: public on the Enrollment website', (await eventually(async () => (await enrollStatus(SLUG)) === 200)) === true, savedE)
  check('Enrollment only: no longer public on Main', (await eventually(async () => (await get(`/blog/${SLUG}`)).status === 404)) === true)

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
} finally {
  if (blogId) {
    await admin.goto(screen('blogs'))
    const row = admin.locator('.acv-main-table tr', { hasText: SLUG })
    if (await row.count()) await follow(admin, row.locator('a', { hasText: 'Trash' }))
    await admin.goto(screen('blogs', '&trashed=1'))
    const trashed = admin.locator('.acv-main-table tr', { hasText: SLUG })
    if (await trashed.count()) await follow(admin, trashed.locator('a', { hasText: 'Delete permanently' }))
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
