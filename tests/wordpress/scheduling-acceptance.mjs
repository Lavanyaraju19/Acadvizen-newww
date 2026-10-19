// Scheduled publishing, end to end through the WordPress admin (LOCAL by default; never pointed at
// production by the documented workflow). One labelled noindex page is set to Published with
// "Publish automatically on" = now + 3 min and "Remove automatically on" = now + 6 min, in the site's
// own time zone (shown next to the field). The public Main URL is polled and the observed switch times
// are recorded. The page is removed at the end through the admin's own Trash / Delete permanently.
//   WP_ADMIN_USER=… WP_ADMIN_PASS=… node tests/wordpress/scheduling-acceptance.mjs
import { WP, MAIN, T, screen, get, launch, login, saveForm } from './acceptanceKit.mjs'

const APPEAR_MIN = Number(process.env.SCHEDULE_APPEAR_MIN || 3)
const REMOVE_MIN = Number(process.env.SCHEDULE_REMOVE_MIN || 6)
let pass = 0
let fail = 0
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const stamp = () => new Date().toISOString().slice(11, 19) + 'Z'

// "YYYY-MM-DDTHH:MM" for a moment, in the time zone WordPress shows next to the field.
function localInput(date, zone) {
  const offset = zone.match(/^(?:UTC)?([+-])(\d{1,2}):?(\d{2})?$/)
  if (zone === 'UTC' || offset) {
    const minutes = offset ? (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3] || 0)) : 0
    return new Date(date.getTime() + minutes * 60000).toISOString().slice(0, 16)
  }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map((p) => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}
async function waitFor(path, wanted, until) {
  while (Date.now() < until) {
    const status = (await get(path)).status
    if (status === wanted) return { ok: true, at: new Date() }
    await new Promise((r) => setTimeout(r, 10000))
  }
  return { ok: false, at: new Date() }
}

const { browser } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const SLUG = `cms-test-scheduled-${T}`
let pageId = ''
try {
  await admin.goto(screen('pages', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', `CMS TEST scheduled page ${T}`)
  await admin.fill('[name="acv_field[slug]"]', SLUG)
  await admin.fill('[name="acv_field[description]"]', 'Disposable scheduling test page.')
  await admin.locator('[name="acv_field[noindex]"]').check()
  const zone = (await admin.locator('[name="acv_field[scheduled_publish_at]"] + .description').innerText()).trim()
  const minute = 60000
  const base = new Date(Math.ceil(Date.now() / minute) * minute)
  const appear = new Date(base.getTime() + APPEAR_MIN * minute)
  const remove = new Date(base.getTime() + REMOVE_MIN * minute)
  await admin.fill('[name="acv_field[scheduled_publish_at]"]', localInput(appear, zone))
  await admin.fill('[name="acv_field[scheduled_unpublish_at]"]', localInput(remove, zone))
  await admin.selectOption('#acv-status', 'published')
  const saved = await saveForm(admin)
  pageId = new URL(admin.url()).searchParams.get('id') || ''
  check('S1 saved as Published with both schedule times', /Saved/.test(saved) && Boolean(pageId), `${saved} | site time zone "${zone}" | appear ${appear.toISOString()} | remove ${remove.toISOString()}`)
  const stored = await admin.inputValue('[name="acv_field[scheduled_publish_at]"]')
  check('S2 the editor shows back the same local time (no time-zone shift)', stored === localInput(appear, zone), `${stored}`)
  await admin.goto(screen('pages', `&s=${SLUG}`))
  const badge = (await admin.locator('.acv-main-table tr', { hasText: SLUG }).first().innerText().catch(() => '')).replace(/\s+/g, ' ')
  check('S3 the list shows "Scheduled for …"', /Scheduled for/.test(badge), badge.slice(0, 120))
  check('S4 before its time the page is not public', (await get(`/${SLUG}`)).status === 404, stamp())
  const shown = await waitFor(`/${SLUG}`, 200, appear.getTime() + 2 * minute)
  const lateBy = Math.round((shown.at - appear) / 1000)
  check('S5 the page appears on Main at its time (within 2 minutes)', shown.ok && shown.at >= appear, `public at ${shown.at.toISOString()} (${lateBy}s after the scheduled time)`)
  const gone = await waitFor(`/${SLUG}`, 404, remove.getTime() + 2 * minute)
  check('S6 the page is removed from Main at its "remove" time (within 2 minutes)', gone.ok && gone.at >= remove, `404 at ${gone.at.toISOString()} (${Math.round((gone.at - remove) / 1000)}s after)`)
} catch (error) {
  check('run finished without an unexpected error', false, String(error.message || error).split(/\r?\n/)[0])
} finally {
  // KEEP_TEST_ITEM=1 (production): the page is not deleted; its own "remove" time already took it off line.
  if (process.env.KEEP_TEST_ITEM === '1') {
    await admin.goto(screen('pages', `&s=${SLUG}`)).catch(() => {})
    const kept = await admin.locator('.acv-main-table tr', { hasText: SLUG }).count().catch(() => 0)
    check('Z kept: test page still in the admin (not deleted) and not public', kept >= 1 && (await get(`/${SLUG}`)).status === 404, `${kept} listed`)
    await browser.close()
    console.log(`\n${pass} passed, ${fail} failed | ${MAIN} | page /${SLUG} KEPT`)
    process.exit(fail ? 1 : 0)
  }
  for (const [view, label] of [['', 'Trash'], ['&trashed=1', 'Delete permanently']]) {
    await admin.goto(screen('pages', `${view}&s=${SLUG}`)).catch(() => {})
    const href = await admin.locator('.acv-main-table tr', { hasText: SLUG }).first().locator('a', { hasText: label }).getAttribute('href', { timeout: 15000 }).catch(() => '')
    if (href) await admin.goto(new URL(href, `${WP}/wp-admin/`).href).catch(() => {})
  }
  await admin.goto(screen('pages', `&s=${SLUG}`)); const listed = await admin.locator('.acv-main-table tr', { hasText: SLUG }).count()
  await admin.goto(screen('pages', `&trashed=1&s=${SLUG}`)); const trashed = await admin.locator('.acv-main-table tr', { hasText: SLUG }).count()
  check('Z cleanup: test page removed (list and trash empty, 404)', listed + trashed === 0 && (await get(`/${SLUG}`)).status === 404, `${listed} listed, ${trashed} in trash`)
  await browser.close()
  console.log(`\n${pass} passed, ${fail} failed | ${MAIN} | page /${SLUG}`)
  process.exit(fail ? 1 : 0)
}
