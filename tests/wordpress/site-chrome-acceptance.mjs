// Acceptance of Acadvizen Master Admin → Main Website → Whole website (header, footer, menus, site
// settings), through the real WordPress admin in a browser, as a non-technical administrator.
// LOCAL by default (see tests/wordpress/README.md). Every change is reverted at the end.
//
//   WP_ADMIN_USER=… WP_ADMIN_PASS=… WORDPRESS_CMS_WEBHOOK_SECRET=… node tests/wordpress/site-chrome-acceptance.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAIN, T, adminShot, api, createRecorder, diffRatio, follow, get, launch, login, saveForm, screen, shot, viewer } from './acceptanceKit.mjs'

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/cms-implementation/evidence/local-site-chrome')
const { results, check } = createRecorder(OUT)
const file = (name) => path.join(OUT, name)
const { browser, counter } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const view = await viewer(browser)

// What exists before the run, so it can be put back exactly.
const before = {}
for (const entity of ['header_settings', 'footer_settings']) {
  const list = await api({ op: 'list', entity, limit: 5 })
  before[entity] = (await api({ op: 'get', entity, id: list.body.data[0].id })).body.data
}
before.site_settings = (await api({ op: 'get', entity: 'site_settings', id: 'default' })).body.data
const menusBefore = (await api({ op: 'list', entity: 'menus', limit: 200 })).body.data || []

try {
  /* 1. Find the screens ------------------------------------------------------------------------ */
  await admin.goto(screen('pages'))
  const siteTabs = await admin.locator('.acv-main-subtabs .nav-tab').allInnerTexts()
  check('1 "Whole website" tabs: Header, Footer, Menus, Site settings', ['Header', 'Footer', 'Menus', 'Site settings'].every((t) => siteTabs.includes(t)), siteTabs.join(', '))

  /* 2. Copy the links shown today: the website must look exactly the same ---------------------- */
  check('2 precondition: no menu links stored yet (the site shows its built-in links)', menusBefore.length === 0, `${menusBefore.length} rows`)
  const desk0 = await shot(view, `${MAIN}/`, file('home-desktop-before.png'), 1440)
  const mob0 = await shot(view, `${MAIN}/`, file('home-mobile-before.png'), 390)
  await admin.goto(screen('menus'))
  const copied = await follow(admin, admin.locator('a', { hasText: 'Copy the links shown today' }))
  check('2 "Copy the links shown today" copies header, footer and legal links', /header: 5/.test(copied) && /footer: 5/.test(copied) && /legal: 2/.test(copied), copied)
  await adminShot(admin, file('admin-menus-after-copy.png'))
  const rows = await admin.locator('.acv-main-table tbody tr').count()
  check('2 the 12 links are listed', rows === 12, `${rows} rows`)
  const desk1 = await shot(view, `${MAIN}/`, file('home-desktop-after-copy.png'), 1440)
  const mob1 = await shot(view, `${MAIN}/`, file('home-mobile-after-copy.png'), 390)
  for (const [label, a, b] of [['desktop', desk0, desk1], ['mobile', mob0, mob1]]) {
    const d = await diffRatio(a, b)
    check(`2 after copying, the homepage is visually identical (${label})`, d.ratio !== null && d.ratio < 0.001, d.ratio === null ? d.size : `${(d.ratio * 100).toFixed(3)}% pixels differ, ${d.size}`)
  }
  const again = await follow(admin, admin.locator('a', { hasText: 'Copy the links shown today' }))
  check('2 copying again changes nothing', /Nothing to copy/.test(again), again)

  /* 3. Edit, hide and show a link -------------------------------------------------------------- */
  await admin.goto(screen('menus', '&f_menu_location=footer'))
  await follow(admin, admin.locator('.acv-main-table tr', { hasText: 'Course Catalog' }).locator('a', { hasText: 'Edit' }))
  await admin.fill('[name="acv_field[title]"]', `Course Catalog ${T}`)
  check('3 footer link saved', /Saved on the Main Website/.test(await saveForm(admin)))
  check('3 the footer shows the new link text', (await get('/')).html.includes(`Course Catalog ${T}`))
  await admin.fill('[name="acv_field[title]"]', 'Course Catalog')
  await saveForm(admin)
  check('3 restored link text is back on the website', !(await get('/')).html.includes(`Course Catalog ${T}`) && (await get('/')).html.includes('Course Catalog'))

  await admin.goto(screen('menus', '&f_menu_location=header'))
  const placementRow = () => admin.locator('.acv-main-table tr', { hasText: 'Placement' })
  await follow(admin, placementRow().locator('a', { hasText: 'Hide' }))
  const hidden = await get('/')
  check('3 hiding the "Placement" header link removes it from the website', !/href="\/placement"/.test(hidden.html))
  await follow(admin, placementRow().locator('a', { hasText: 'Show on Main' }))
  check('3 showing it again brings it back', /href="\/placement"/.test((await get('/')).html))

  /* 4. Header: the announcement bar; untouched colours stay empty ----------------------------- */
  await admin.goto(screen('header_settings'))
  await follow(admin, admin.locator('.acv-main-table a', { hasText: 'Edit' }).first())
  await admin.locator('[name="acv_field[announcement_enabled]"]').check()
  await admin.fill('[name="acv_field[announcement_text]"]', `CMS TEST announcement ${T}`)
  check('4 header saved', /Saved on the Main Website/.test(await saveForm(admin)))
  check('4 the announcement bar shows on the website', (await get('/')).html.includes(`CMS TEST announcement ${T}`))
  const headerNow = (await api({ op: 'get', entity: 'header_settings', id: before.header_settings.id })).body.data
  check('4 colours left untouched stay empty (website defaults, not black)', ['announcement_bg_color', 'announcement_text_color', 'header_border_color'].every((k) => (headerNow[k] ?? null) === (before.header_settings[k] ?? null)), ['announcement_bg_color', 'announcement_text_color', 'header_border_color'].map((k) => `${k}=${headerNow[k] ?? 'empty'}`).join(' '))
  await adminShot(admin, file('admin-header.png'))

  /* 5. Footer copyright and a website label ---------------------------------------------------- */
  await admin.goto(screen('footer_settings'))
  await follow(admin, admin.locator('.acv-main-table a', { hasText: 'Edit' }).first())
  await admin.fill('[name="acv_field[copyright_text]"]', `© {year} {company} CMS TEST ${T}`)
  await saveForm(admin)
  check('5 the footer shows the new copyright line, with the year filled in', (await get('/')).html.includes(`CMS TEST ${T}`) && (await get('/')).html.includes(String(new Date().getFullYear())))
  await admin.goto(screen('site_settings'))
  await follow(admin, admin.locator('.acv-main-table a', { hasText: 'Edit' }).first())
  await admin.getByLabel('Footer nav heading', { exact: true }).fill(`Academy Index ${T}`)
  await saveForm(admin)
  check('5 a website label (footer heading) changes on the website', (await get('/')).html.includes(`Academy Index ${T}`))
  await adminShot(admin, file('admin-site-settings.png'))
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  /* Z. Put everything back --------------------------------------------------------------------- */
  const pick = (row, keys) => Object.fromEntries(keys.filter((k) => k in row).map((k) => [k, row[k]]))
  await api({ op: 'save', entity: 'header_settings', id: before.header_settings.id, record: pick(before.header_settings, ['announcement_enabled', 'announcement_text', 'announcement_link', 'announcement_bg_color', 'announcement_text_color', 'phone_number', 'email_address', 'social_items', 'header_border_color']) })
  await api({ op: 'save', entity: 'footer_settings', id: before.footer_settings.id, record: pick(before.footer_settings, ['logo_alt', 'contact_phone', 'contact_email', 'contact_address', 'social_items', 'copyright_text', 'footer_bg_color', 'footer_border_color']) })
  await api({ op: 'save', entity: 'site_settings', id: 'default', record: pick(before.site_settings, ['company_name', 'social_links', 'ui_copy']) })
  const now = (await api({ op: 'list', entity: 'menus', limit: 200 })).body.data || []
  for (const row of now.filter((r) => !menusBefore.some((b) => b.id === r.id))) {
    await api({ op: 'set_status', entity: 'menus', id: row.id, active: false })
    await api({ op: 'delete', entity: 'menus', id: row.id, confirm: true })
  }
  const left = ((await api({ op: 'list', entity: 'menus', limit: 200 })).body.data || []).length
  const home = await get('/')
  check('Z everything put back (menus as before, no test text on the website)', left === menusBefore.length && !home.html.includes(T), `${left} menu rows`)
  fs.writeFileSync(path.join(OUT, `results-${T}.json`), JSON.stringify({ run: T, main: MAIN, click_fallbacks: counter.fallbacks, results }, null, 1))
  await browser.close()
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed (click fallbacks: ${counter.fallbacks})`)
}
