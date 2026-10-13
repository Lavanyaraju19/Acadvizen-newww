// Acceptance of Acadvizen Master Admin → Main Website → Courses and Course sections, through the real
// WordPress admin in a browser, as a non-technical administrator. LOCAL by default; the test course
// is removed at the end.
//
//   WP_ADMIN_USER=… WP_ADMIN_PASS=… WORDPRESS_CMS_WEBHOOK_SECRET=… node tests/wordpress/courses-acceptance.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAIN, T, adminShot, api, createRecorder, follow, get, launch, login, saveForm, screen, shot, viewer } from './acceptanceKit.mjs'

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/cms-implementation/evidence/local-courses')
const { results, check } = createRecorder(OUT)
const file = (name) => path.join(OUT, name)
const { browser, counter } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const view = await viewer(browser)
const SLUG = `cms-test-course-${T}`
const TITLE = `CMS TEST course ${T}`
let courseId = ''
let feedPageId = ''

try {
  /* 1. Create a course with a curriculum and skills, and show it ------------------------------- */
  await admin.goto(screen('pages'))
  const tabs = (await admin.locator('.nav-tab').allInnerTexts()).join(', ')
  check('1 "Courses" and "Course sections" tabs', /Courses/.test(tabs) && /Course sections/.test(tabs), tabs)
  await admin.goto(screen('courses', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', TITLE)
  await admin.fill('[name="acv_field[slug]"]', SLUG)
  await admin.fill('[name="acv_field[short_description]"]', `Short description ${T}`)
  await admin.fill('[name="acv_field[skills]"]', `Skill A ${T}\nSkill B ${T}`)
  // Curriculum: one module with two topics, through the structured editor.
  const curriculum = admin.locator('.acv-json').first()
  await curriculum.locator('button', { hasText: '+ Add' }).click()
  await curriculum.getByLabel('Title', { exact: true }).first().fill(`Module ${T}`)
  await curriculum.getByLabel('Topics (one per line)').first().fill(`Topic one ${T}\nTopic two ${T}`)
  await admin.locator('[name="acv_active"]').check()
  const created = await saveForm(admin)
  courseId = new URL(admin.url()).searchParams.get('id') || ''
  check('1 course created and shown', /Saved on the Main Website/.test(created) && Boolean(courseId), created)
  await adminShot(admin, file('admin-course-edit.png'))
  const page = await get(`/courses/${SLUG}`)
  check('1 the course page shows the title, a module, its topics and a skill', page.status === 200 && page.html.includes(TITLE) && page.html.includes(`Module ${T}`) && page.html.includes(`Topic two ${T}`) && page.html.includes(`Skill B ${T}`), `HTTP ${page.status}`)
  // On this site /courses is a CMS page (Pages → courses); a page lists courses through a
  // "Live list: courses" section. Checked on a disposable page.
  const feedPage = await api({ op: 'save', entity: 'pages', record: { title: `CMS TEST course list ${T}`, slug: `cms-test-course-list-${T}`, noindex: true } })
  feedPageId = feedPage.body?.data?.id || ''
  await api({ op: 'save', entity: 'sections', record: { page_id: feedPageId, type: 'courses_feed', order_index: 0, content_json: { heading: 'Our courses', limit: '50' } } })
  await api({ op: 'set_status', entity: 'pages', id: feedPageId, status: 'published' })
  check('1 a "Live list: courses" section lists the new course', (await get(`/cms-test-course-list-${T}`)).html.includes(TITLE))
  await shot(view, `${MAIN}/courses/${SLUG}`, file('course-page-desktop.png'), 1440)
  await shot(view, `${MAIN}/courses/${SLUG}`, file('course-page-mobile.png'), 390)

  /* 2. Edit, then restore the earlier version ---------------------------------------------------- */
  await admin.fill('[name="acv_field[short_description]"]', `Edited description ${T}`)
  await saveForm(admin)
  check('2 the edit shows on the course page', (await get(`/courses/${SLUG}`)).html.includes(`Edited description ${T}`))
  await follow(admin, admin.locator('.acv-main-versions li').nth(1).locator('a', { hasText: 'Restore' }))
  const restored = (await get(`/courses/${SLUG}`)).html
  check('2 restoring the earlier version brings the first description back', restored.includes(`Short description ${T}`) && !restored.includes(`Edited description ${T}`))

  /* 3. Course sections ------------------------------------------------------------------------- */
  await admin.goto(screen('course_details'))
  check('3 course sections ask for a course first', /Choose a course/.test(await admin.locator('#wpbody-content').innerText()))
  await admin.goto(screen('course_details', `&parent_id=${courseId}`))
  await follow(admin, admin.locator('a', { hasText: 'Add a section to this course' }))
  check('3 a new section starts with the chosen course', (await admin.inputValue('[name="acv_field[course_id]"]')) === courseId)
  await admin.fill('[name="acv_field[section_title]"]', `Fees ${T}`)
  await admin.fill('[name="acv_field[content]"]', 'Instalments available.')
  check('3 section saved', /Saved on the Main Website/.test(await saveForm(admin)))
  await admin.goto(screen('course_details', `&parent_id=${courseId}`))
  check('3 the section is listed under its course', (await admin.locator('.acv-main-table').innerText()).includes(`Fees ${T}`))

  /* 4. Hide the course -------------------------------------------------------------------------- */
  await admin.goto(screen('courses'))
  await follow(admin, admin.locator('.acv-main-table tr', { hasText: TITLE }).locator('a', { hasText: 'Hide' }))
  check('4 hiding the course removes it from its page and from course lists', !(await get(`/courses/${SLUG}`)).html.includes(TITLE) && !(await get(`/cms-test-course-list-${T}`)).html.includes(TITLE))
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  /* Z. Remove the test course and its sections (through the same signed API) ------------------ */
  if (courseId) {
    const sections = (await api({ op: 'list', entity: 'course_details', parent_id: courseId, limit: 50 })).body.data || []
    for (const s of sections) await api({ op: 'delete', entity: 'course_details', id: s.id, confirm: true })
    await api({ op: 'set_status', entity: 'courses', id: courseId, active: false })
    await api({ op: 'trash', entity: 'courses', id: courseId })
    await api({ op: 'delete', entity: 'courses', id: courseId, confirm: true })
  }
  if (feedPageId) {
    await api({ op: 'trash', entity: 'pages', id: feedPageId })
    await api({ op: 'delete', entity: 'pages', id: feedPageId, confirm: true })
  }
  const gone = await get(`/courses/${SLUG}`)
  check('Z the test course and list page are gone', !gone.html.includes(TITLE) && (await get(`/cms-test-course-list-${T}`)).status === 404)
  fs.writeFileSync(path.join(OUT, `results-${T}.json`), JSON.stringify({ run: T, main: MAIN, click_fallbacks: counter.fallbacks, results }, null, 1))
  await browser.close()
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed (click fallbacks: ${counter.fallbacks})`)
  // A failed check must fail the run, not only print FAIL.
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
}
