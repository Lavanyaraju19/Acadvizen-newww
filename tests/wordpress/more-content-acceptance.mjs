// Acceptance of Acadvizen Master Admin → Main Website → City pages, Service pages, SEO overrides and
// the Media library, through the real WordPress admin in a browser. LOCAL by default; everything the
// run creates is removed at the end.
//
//   WP_ADMIN_USER=… WP_ADMIN_PASS=… WORDPRESS_CMS_WEBHOOK_SECRET=… [LOCAL_DB_CONTAINER=…] \
//     node tests/wordpress/more-content-acceptance.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { MAIN, T, adminShot, api, createRecorder, follow, get, launch, login, saveForm, screen } from './acceptanceKit.mjs'

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/cms-implementation/evidence/local-more-content')
const { results, check } = createRecorder(OUT)
const file = (name) => path.join(OUT, name)
const { browser, counter } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const CITY = `cms-test-city-${T}`
const SERVICE = `cms-test-service-${T}`
const PAGE_SLUG = process.env.TEST_PAGE_SLUG || 'seo-course-in-bangalore'
const local = /localhost|127\.0\.0\.1/.test(MAIN) && process.env.LOCAL_DB_CONTAINER
const sql = (q) => execSync(`docker exec ${process.env.LOCAL_DB_CONTAINER} psql -U postgres -tAc "${q}"`).toString().trim()
const made = { city: '', service: '', media: '', override: '' }
const title = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''

try {
  /* 1. City page with a feature and a section placed at the top -------------------------------- */
  await admin.goto(screen('city_pages', '&view=edit'))
  await admin.fill('[name="acv_field[city_name]"]', `Testpur ${T}`)
  await admin.fill('[name="acv_field[slug]"]', CITY)
  await admin.fill('[name="acv_field[hero_title]"]', `CMS TEST city heading ${T}`)
  const features = admin.locator('.acv-json').first()
  await features.locator('button', { hasText: '+ Add' }).click()
  await features.getByLabel('Title', { exact: true }).first().fill(`Feature ${T}`)
  await features.getByLabel('List (one per line)').first().fill('Point one\nPoint two')
  await admin.locator('[name="acv_active"]').check()
  check('1 city page created and shown', /Saved on the Main Website/.test(await saveForm(admin)))
  made.city = new URL(admin.url()).searchParams.get('id') || ''
  const cityPage = await get(`/digital-marketing-course-in-${CITY}`)
  check('1 the city page shows its heading and feature', cityPage.status === 200 && cityPage.html.includes(`CMS TEST city heading ${T}`) && cityPage.html.includes(`Feature ${T}`), `HTTP ${cityPage.status}`)
  // A section from the page section editor, placed "At the top".
  await admin.selectOption('#acv-sections .acv-add-row select', 'text_block')
  await admin.locator('#acv-sections .acv-add-row button', { hasText: 'Add' }).click()
  const card = admin.locator('#acv-sections .acv-section').last()
  await card.getByLabel('Heading', { exact: true }).fill(`City section ${T}`)
  await card.locator('summary', { hasText: 'Design and devices' }).click()
  await card.locator('select').filter({ has: admin.locator('option[value="top"]') }).selectOption('top')
  await card.locator('button', { hasText: 'Save section' }).click()
  await card.locator('.acv-section-status--ok, .acv-section-status--error').waitFor({ timeout: 30000 })
  const withSection = (await get(`/digital-marketing-course-in-${CITY}`)).html
  check('1 the section shows at the top of the city page', withSection.includes(`City section ${T}`) && withSection.indexOf(`City section ${T}`) < withSection.indexOf(`Feature ${T}`))
  await adminShot(admin, file('admin-city-page.png'))

  /* 2. Service page: an address used by a page is refused; a free one works ------------------- */
  await admin.goto(screen('service_pages', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', `CMS TEST service ${T}`)
  await admin.fill('[name="acv_field[slug]"]', PAGE_SLUG)
  check('2 an address already used by a page is refused', /already used by a page/.test(await saveForm(admin)))
  await admin.fill('[name="acv_field[slug]"]', SERVICE)
  await admin.fill('[name="acv_field[hero_title]"]', `CMS TEST service heading ${T}`)
  await admin.locator('[name="acv_active"]').check()
  check('2 service page created', /Saved on the Main Website/.test(await saveForm(admin)))
  made.service = new URL(admin.url()).searchParams.get('id') || ''
  check('2 the service page answers at its address', (await get(`/${SERVICE}`)).html.includes(`CMS TEST service heading ${T}`))

  /* 3. SEO override: noticed on the page, editable, removable ---------------------------------- */
  if (local) {
    const pageId = sql(`select id from public.pages where slug='${PAGE_SLUG}' and draft_of_id is null`)
    made.override = sql(`insert into public.seo_metadata(page_slug, page_id, meta_title) values ('${PAGE_SLUG}', '${pageId}', 'CMS TEST override ${T}') returning id`).split('\n')[0]
    check('3 precondition: an override is in use on the page', title((await get(`/${PAGE_SLUG}`)).html).includes(`CMS TEST override ${T}`))
    await admin.goto(screen('pages', `&view=edit&id=${pageId}`))
    check('3 the page editor says an SEO override is in use', /An SEO override for this address is in use/.test(await admin.locator('#wpbody-content').innerText()))
    await follow(admin, admin.locator('a', { hasText: 'Edit the override' }))
    await admin.fill('[name="acv_field[meta_title]"]', `CMS TEST override edited ${T}`)
    await saveForm(admin)
    check('3 an edited override changes the page title', title((await get(`/${PAGE_SLUG}`)).html).includes(`CMS TEST override edited ${T}`))
    await admin.goto(screen('seo_metadata'))
    await follow(admin, admin.locator('.acv-main-table tr', { hasText: PAGE_SLUG }).locator('a', { hasText: 'Remove override' }))
    made.override = ''
    check('3 removing it brings back the page\'s own title', !title((await get(`/${PAGE_SLUG}`)).html).includes('CMS TEST override'))
  }

  /* 4. Media library: upload, describe, pick ---------------------------------------------------- */
  const png = path.join(OUT, `upload-${T}.png`)
  fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'))
  await admin.goto(screen('media'))
  await admin.setInputFiles('input[name="acv_file"]', png)
  await admin.fill('input[name="acv_alt"]', `CMS TEST image ${T}`)
  const uploaded = await follow(admin, admin.locator('.acv-main-upload input[type=submit]'))
  check('4 an image is added to the Main Website library', /Image added/.test(uploaded), uploaded)
  const row = admin.locator('.acv-main-table tr', { hasText: `upload-${T}` }).first()
  check('4 it is listed with a thumbnail', (await row.count()) === 1 && (await row.locator('img').count()) === 1)
  const listed = ((await api({ op: 'list', entity: 'media', search: `upload-${T}`, limit: 5 })).body.data || [])[0] || {}
  made.media = listed.id || ''
  const image = await fetch(listed.url || 'http://invalid.invalid').then((r) => r.status).catch(() => 0)
  check('4 the stored image is publicly reachable', image === 200, `HTTP ${image}`)
  await admin.goto(screen('tools_extended', '&view=edit'))
  await admin.locator('.acv-main-library-pick').first().click()
  await admin.locator('.acv-library-item', { hasText: `upload-${T}` }).first().click()
  check('4 "Main library" fills an image field with the library image', (await admin.inputValue('[name="acv_field[logo_url]"]')) === listed.url)
  fs.rmSync(png, { force: true })
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  /* Z. Remove what the run created ------------------------------------------------------------- */
  if (made.city) {
    await api({ op: 'set_status', entity: 'city_pages', id: made.city, active: false })
    await api({ op: 'trash', entity: 'city_pages', id: made.city })
    await api({ op: 'delete', entity: 'city_pages', id: made.city, confirm: true })
  }
  if (made.service) {
    await api({ op: 'set_status', entity: 'service_pages', id: made.service, active: false })
    await api({ op: 'delete', entity: 'service_pages', id: made.service, confirm: true })
  }
  if (local) {
    if (made.override) sql(`delete from public.seo_metadata where id='${made.override}'`)
    sql("delete from public.city_page_sections where city_page_id not in (select id from public.city_pages)")
    if (made.media) sql(`delete from public.media where id='${made.media}'`) // test file only (the API never deletes media)
  }
  const cityGone = await get(`/digital-marketing-course-in-${CITY}`)
  check('Z test pages are gone', !cityGone.html.includes(T) && !(await get(`/${SERVICE}`)).html.includes(T))
  fs.writeFileSync(path.join(OUT, `results-${T}.json`), JSON.stringify({ run: T, main: MAIN, click_fallbacks: counter.fallbacks, results }, null, 1))
  await browser.close()
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed (click fallbacks: ${counter.fallbacks})`)
  // A failed check must fail the run, not only print FAIL.
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
}
