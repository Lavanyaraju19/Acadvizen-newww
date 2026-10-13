// Acceptance of Acadvizen Master Admin → Main Website → Homepage (banner, closing call to action,
// lists), through the real WordPress admin in a browser, as a non-technical administrator.
// LOCAL by default (see tests/wordpress/README.md). Every change is reverted at the end.
//
//   WP_ADMIN_USER=… WP_ADMIN_PASS=… WORDPRESS_CMS_WEBHOOK_SECRET=… node tests/wordpress/homepage-acceptance.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOME_LISTS } from '../../lib/homepageDefaults.js'
import { MAIN, T, adminShot, api, createRecorder, diffRatio, follow, get, launch, login, saveForm, screen, shot, viewer } from './acceptanceKit.mjs'

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/cms-implementation/evidence/local-homepage')
const { results, check } = createRecorder(OUT)
const file = (name) => path.join(OUT, name)
const { browser, counter } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const view = await viewer(browser)

const listsBefore = (await api({ op: 'list', entity: 'home_lists', limit: 50 })).body.data || []
const heroId = (await api({ op: 'list', entity: 'homepage_hero', limit: 5 })).body.data[0].id
const ctaId = (await api({ op: 'list', entity: 'homepage_cta', limit: 5 })).body.data[0].id
const heroBefore = (await api({ op: 'get', entity: 'homepage_hero', id: heroId })).body.data
const ctaBefore = (await api({ op: 'get', entity: 'homepage_cta', id: ctaId })).body.data
const firstQuestion = HOME_LISTS.faq.defaults[0].question

try {
  /* 1. Find the screens ------------------------------------------------------------------------ */
  await admin.goto(screen('pages'))
  const rows = await admin.locator('.acv-main-subtabs').allInnerTexts()
  const homeRow = rows.find((r) => r.startsWith('Homepage')) || ''
  check('1 "Homepage" tabs: Banner, Closing call to action, Sections, Lists', ['Banner', 'Closing call to action', 'Sections', 'Lists'].every((t) => homeRow.includes(t)), homeRow.replace(/\s+/g, ' '))

  /* 2. Copy what the homepage shows today: it must look exactly the same ----------------------- */
  check('2 precondition: no list copied yet', listsBefore.length === 0, `${listsBefore.length} lists`)
  const desk0 = await shot(view, `${MAIN}/`, file('home-desktop-before.png'), 1440)
  const mob0 = await shot(view, `${MAIN}/`, file('home-mobile-before.png'), 390)
  await admin.goto(screen('home_lists'))
  const copied = await follow(admin, admin.locator('a', { hasText: 'Copy what the homepage shows today' }))
  check('2 the 8 homepage lists are copied', /Copied 8 lists/.test(copied), copied)
  await adminShot(admin, file('admin-home-lists.png'))
  const desk1 = await shot(view, `${MAIN}/`, file('home-desktop-after-copy.png'), 1440)
  const mob1 = await shot(view, `${MAIN}/`, file('home-mobile-after-copy.png'), 390)
  for (const [label, a, b] of [['desktop', desk0, desk1], ['mobile', mob0, mob1]]) {
    const d = await diffRatio(a, b)
    check(`2 after copying, the homepage is visually identical (${label})`, d.ratio !== null && d.ratio < 0.001, d.ratio === null ? d.size : `${(d.ratio * 100).toFixed(3)}% pixels differ, ${d.size}`)
  }

  /* 3. Edit an FAQ question; restore the earlier version -------------------------------------- */
  await follow(admin, admin.locator('.acv-main-table tr', { hasText: 'Frequently asked questions' }).locator('a', { hasText: 'Edit' }))
  const question = admin.getByLabel('Question', { exact: true }).first()
  check('3 the FAQ list opens with its questions', (await question.inputValue()) === firstQuestion)
  await question.fill(`CMS TEST question ${T}?`)
  check('3 FAQ saved', /Saved on the Main Website/.test(await saveForm(admin)))
  check('3 the homepage shows the edited question', (await get('/')).html.includes(`CMS TEST question ${T}?`))
  await adminShot(admin, file('admin-faq-edit.png'))
  await follow(admin, admin.locator('.acv-main-versions li').nth(1).locator('a', { hasText: 'Restore' }))
  const restored = (await get('/')).html
  check('3 restoring the earlier version brings the original question back', !restored.includes(`CMS TEST question ${T}?`) && restored.includes(firstQuestion.slice(0, 40)))

  /* 4. Hide a list: the built-in list comes back, unchanged ------------------------------------ */
  await admin.goto(screen('home_lists'))
  await follow(admin, admin.locator('.acv-main-table tr', { hasText: 'Frequently asked questions' }).locator('a', { hasText: 'Hide' }))
  const desk2 = await shot(view, `${MAIN}/`, file('home-desktop-faq-hidden.png'), 1440)
  const d2 = await diffRatio(desk0, desk2)
  check('4 hiding the FAQ list shows the built-in FAQ (homepage as before)', d2.ratio !== null && d2.ratio < 0.001, d2.ratio === null ? d2.size : `${(d2.ratio * 100).toFixed(3)}% pixels differ`)
  await follow(admin, admin.locator('.acv-main-table tr', { hasText: 'Frequently asked questions' }).locator('a', { hasText: 'Show on Main' }))

  /* 5. Banner and closing call to action ------------------------------------------------------- */
  await admin.goto(screen('homepage_hero'))
  await follow(admin, admin.locator('.acv-main-table a', { hasText: 'Edit' }).first())
  await admin.fill('[name="acv_field[heading]"]', `CMS TEST heading ${T}`)
  check('5 banner saved', /Saved on the Main Website/.test(await saveForm(admin)))
  check('5 the homepage banner shows the new heading', (await get('/')).html.includes(`CMS TEST heading ${T}`))
  await admin.goto(screen('homepage_cta'))
  await follow(admin, admin.locator('.acv-main-table a', { hasText: 'Edit' }).first())
  await admin.fill('[name="acv_field[button_text]"]', `CMS TEST button ${T}`)
  await saveForm(admin)
  check('5 the closing call to action shows the new button text', (await get('/')).html.includes(`CMS TEST button ${T}`))
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  /* Z. Put everything back --------------------------------------------------------------------- */
  const pick = (row, keys) => Object.fromEntries(keys.map((k) => [k, row[k] ?? null]))
  await api({ op: 'save', entity: 'homepage_hero', id: heroId, record: pick(heroBefore, ['badge_text', 'heading', 'subheading']) })
  await api({ op: 'save', entity: 'homepage_cta', id: ctaId, record: pick(ctaBefore, ['title', 'description', 'button_text', 'button_link']) })
  // The copied lists are hidden (the built-in lists show again); LOCAL runs also remove them.
  const now = (await api({ op: 'list', entity: 'home_lists', limit: 50 })).body.data || []
  for (const row of now.filter((r) => !listsBefore.some((b) => b.id === r.id))) await api({ op: 'set_status', entity: 'home_lists', id: row.id, active: false })
  if (/localhost|127\.0\.0\.1/.test(MAIN) && process.env.LOCAL_DB_CONTAINER) {
    const { execSync } = await import('node:child_process')
    execSync(`docker exec ${process.env.LOCAL_DB_CONTAINER} psql -U postgres -tAc "delete from public.home_sections where section_key like 'home_list_%'"`)
  }
  const desk9 = await shot(view, `${MAIN}/`, file('home-desktop-after-cleanup.png'), 1440)
  const d9 = await diffRatio(path.join(OUT, 'home-desktop-before.png'), desk9).catch(() => ({ ratio: null, size: 'no baseline' }))
  check('Z everything put back (homepage as before)', d9.ratio !== null && d9.ratio < 0.001 && !(await get('/')).html.includes(T), d9.ratio === null ? d9.size : `${(d9.ratio * 100).toFixed(3)}% pixels differ`)
  fs.writeFileSync(path.join(OUT, `results-${T}.json`), JSON.stringify({ run: T, main: MAIN, click_fallbacks: counter.fallbacks, results }, null, 1))
  await browser.close()
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed (click fallbacks: ${counter.fallbacks})`)
  // A failed check must fail the run, not only print FAIL.
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
}
