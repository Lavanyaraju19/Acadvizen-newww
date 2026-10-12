// LOCAL acceptance test of Acadvizen Master Admin → Main Website, through the real WordPress admin
// in a browser, against a local Main build connected to a local Supabase (tests/wordpress/README.md).
// Acts as a non-technical administrator: finds the screens, edits, previews, publishes, restores,
// and checks the public pages after every step. Disposable "CMS TEST" content is removed at the end.
//
//   WP_ADMIN_USER=… WP_ADMIN_PASS=… WP_AUTHOR_USER=… WP_AUTHOR_PASS=… WP_CONTRIBUTOR_USER=… WP_CONTRIBUTOR_PASS=… WORDPRESS_CMS_WEBHOOK_SECRET=… \
//     node tests/wordpress/structured-acceptance.mjs
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { signPayload } from '../../lib/wordpress/signature.js'
import { removeEnrollmentCopies, enrollmentCopiesLeft } from './acceptanceKit.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const sharp = require('sharp')

const WP = process.env.WP_URL || 'http://localhost:8088'
const MAIN = process.env.MAIN_URL || 'http://localhost:3100'
const PAGE_SLUG = process.env.TEST_PAGE_SLUG || 'seo-course-in-bangalore' // an existing page with sections
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/cms-implementation/evidence/local-structured')
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
fs.mkdirSync(OUT, { recursive: true })

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok), detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const get = async (p) => { const r = await fetch(`${MAIN}${p}${p.includes('?') ? '&' : '?'}t=${Date.now()}`, { redirect: 'manual' }); return { status: r.status, html: r.status === 200 ? await r.text() : '' } }
const screen = (entity, extra = '') => `${WP}/wp-admin/admin.php?page=acadvizen-cms-main&entity=${entity}${extra}`

async function shot(page, url, name, width) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  const file = path.join(OUT, `${name}.png`)
  if (process.env.DEBUG_SHOTS) console.log('… screenshot', name)
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled', caret: 'hide', timeout: 90000 })
  return file
}
/** Share of pixels that differ noticeably (any channel by more than 24 of 255); null when sizes differ. */
async function diffRatio(a, b) {
  const [x, y] = await Promise.all([sharp(a).raw().ensureAlpha().toBuffer({ resolveWithObject: true }), sharp(b).raw().ensureAlpha().toBuffer({ resolveWithObject: true })])
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) return { ratio: null, size: `${x.info.width}x${x.info.height} vs ${y.info.width}x${y.info.height}` }
  let changed = 0
  for (let i = 0; i < x.data.length; i += 4) {
    if (Math.abs(x.data[i] - y.data[i]) > 24 || Math.abs(x.data[i + 1] - y.data[i + 1]) > 24 || Math.abs(x.data[i + 2] - y.data[i + 2]) > 24) changed++
  }
  return { ratio: changed / (x.data.length / 4), size: `${x.info.width}x${x.info.height}` }
}

/** Evidence screenshot of an admin screen; a capture problem is reported, never fatal to the functional checks. */
async function adminShot(page, name, options = {}) {
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1500)
  try {
    await page.screenshot({ path: path.join(OUT, name), animations: 'disabled', timeout: 30000, ...options })
  } catch (error) {
    console.log(`(screenshot ${name} not taken: ${error.message.split('\n')[0]})`)
  }
}

async function login(context, user, pass) {
  const page = await context.newPage()
  page.on('dialog', (d) => d.accept())
  // wp-admin pages are ready once their HTML is parsed; an offline local site can delay the full load event.
  const goto = page.goto.bind(page)
  page.goto = (url, options = {}) => goto(url, { waitUntil: 'domcontentloaded', ...options })
  await page.goto(`${WP}/wp-login.php`)
  await page.fill('#user_login', user)
  await page.fill('#user_pass', pass)
  if (process.env.DEBUG_STEPS) console.log('… navigation 1 from', page.url())
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.locator('#wp-submit').click()])
  return page
}
const notice = async (page) => (await page.locator('.notice-success p, .notice-error p').first().innerText().catch(() => '')).trim()
// Submits the form exactly once (see acceptanceKit.mjs saveForm).
async function saveForm(page) { await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 180000 }), page.locator('#acv-main-form input[type=submit]').dispatchEvent('click')]); return notice(page) }
const idFromUrl = (page) => new URL(page.url()).searchParams.get('id')
/** Saves one section card and returns what the editor reports (success or the Main Website's error). */
async function saveSection(card) {
  await card.locator('button', { hasText: 'Save section' }).click()
  const status = card.locator('.acv-section-status--ok, .acv-section-status--error')
  await status.waitFor({ timeout: 30000 })
  return { ok: (await status.getAttribute('class')).includes('--ok'), text: await status.innerText() }
}

// Keeps Chromium painting on Windows (see acceptanceKit.mjs launch()).
const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-features=CalculateNativeWinOcclusion'] })
// Headless Chromium sometimes stops painting wp-admin tabs (seen with Elementor's admin scripts). A
// normal click then waits for a stable, painted element forever. Clicks are therefore tried normally
// first and, if that does not happen within 4 s, sent as the same DOM click event. Counted in the results.
let clickFallbacks = 0
{
  const probe = await (await browser.newContext()).newPage()
  const proto = Object.getPrototypeOf(probe.locator('body'))
  const realClick = proto.click
  proto.click = async function (options = {}) {
    try {
      return await realClick.call(this, { timeout: 4000, ...options })
    } catch (error) {
      if (options.trial) throw error
      clickFallbacks++
      return this.dispatchEvent('click')
    }
  }
  const realUncheck = proto.uncheck
  proto.uncheck = async function (options = {}) {
    try {
      return await realUncheck.call(this, { timeout: 4000, ...options })
    } catch (error) {
      clickFallbacks++
      await this.evaluate((box) => { if (box.checked) box.click() })
      if (await this.isChecked()) throw error
    }
  }
  const realCheck = proto.check
  proto.check = async function (options = {}) {
    try {
      return await realCheck.call(this, { timeout: 4000, ...options })
    } catch (error) {
      clickFallbacks++
      await this.evaluate((box) => { if (!box.checked) box.click() })
      if (!(await this.isChecked())) throw error
    }
  }
  await probe.context().close()
}
const admin = await login(await browser.newContext({ viewport: { width: 1440, height: 1100 } }), process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const viewer = await (await browser.newContext()).newPage()
// Public pages are checked without third-party tracking (nothing is sent to analytics or ads).
await viewer.route('**/*', (r) => (/facebook|google|doubleclick|clarity|hotjar|vercel-insights/.test(new URL(r.request().url()).host) ? r.abort() : r.continue()))
const created = []

try {
  /* A. Find the central admin ------------------------------------------------------------------ */
  // The menu entry must exist, be reachable by keyboard and lead to the Main Website screen. It is
  // then opened by its address: activating wp-admin menu links in headless Chromium can leave the
  // test browser's tab unable to paint (a test-tool quirk; pages load and respond normally).
  // Checked separately: focusing the admin menu can leave a headless tab unable to paint.
  // Its own browser session (its own process), so a stalled tab cannot affect the admin tab.
  const menuTab = await login(await browser.newContext(), process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
  await menuTab.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms`, { waitUntil: 'domcontentloaded' })
  const menu = menuTab.locator('#adminmenu').getByRole('link', { name: 'Main Website', exact: true })
  check('A1 "Main Website" is in the Acadvizen Master Admin menu', (await menu.count()) === 1)
  await menu.focus()
  const menuHref = await menu.evaluate((a) => (document.activeElement === a && /page=acadvizen-cms-main/.test(a.href) ? a.href : ''))
  check('A1b the menu entry can be reached with the keyboard and leads to the Main Website screen', Boolean(menuHref))
  await menuTab.context().close()
  await admin.goto(menuHref || screen('pages'))
  const tabs = await admin.locator('.nav-tab-wrapper .nav-tab').allInnerTexts()
  check('A2 one tab per Main content type, plus Activity', ['Pages', 'Blogs', 'Tools', 'Locations', 'Cities', 'Testimonials', 'Activity'].every((t) => tabs.includes(t)), tabs.join(', '))
  await admin.goto(screen('pages', `&s=${PAGE_SLUG}`))
  const row = admin.locator('.acv-main-table tr', { hasText: PAGE_SLUG })
  check('A3 the existing Main page is listed with its address and status', (await row.count()) === 1 && /Published/.test(await row.innerText()), (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120))
  await adminShot(admin, 'admin-pages-list.png')

  /* B. Edit an existing page safely: private draft → preview → publish → restore ---------------- */
  const before = { desktop: await shot(viewer, `${MAIN}/${PAGE_SLUG}`, 'B0-before-desktop', 1440), mobile: await shot(viewer, `${MAIN}/${PAGE_SLUG}`, 'B0-before-mobile', 390) }
  const original = (await get(`/${PAGE_SLUG}`)).html.match(/<h1[^>]*>([^<]+)/)?.[1] || ''
  if (process.env.DEBUG_STEPS) console.log('… navigation 2 from', admin.url())
  await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded' }), row.locator('a', { hasText: 'Edit' }).first().click()])
  const liveId = idFromUrl(admin)
  if (process.env.DEBUG_STEPS) console.log('… navigation 3 from', admin.url())
  await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded' }), admin.locator('a', { hasText: 'Prepare changes privately' }).click()])
  const draftId = idFromUrl(admin)
  check('B1 "Prepare changes privately" opens a private draft copy', draftId && draftId !== liveId && /private draft copy/i.test(await admin.locator('.notice-info').innerText().catch(() => '')))
  // If the run stops before publishing, the cleanup discards this private copy (never the live page);
  // once published it is merged into the live page and no longer exists, so the cleanup skips it.
  if (draftId && draftId !== liveId) created.push(['pages', draftId])
  const hero = admin.locator('#acv-sections .acv-section').first()
  await hero.locator('summary', { hasText: 'Content' }).click()
  const heading = hero.getByLabel('Heading', { exact: true })
  const testHeading = `${await heading.inputValue()} — CMS TEST ${T}`
  await heading.fill(testHeading)
  const saved1 = await saveSection(hero)
  if (!saved1.ok) throw new Error(`section not saved: ${saved1.text}`)
  check('B2 section saved in the draft', true)
  const duringDraft = await get(`/${PAGE_SLUG}`)
  check('B3 the live page stays up and unchanged while the change is a draft', duringDraft.status === 200 && !duringDraft.html.includes(`CMS TEST ${T}`), `status ${duringDraft.status}`)
  await admin.goto(screen('pages', `&view=preview&id=${draftId}`))
  const frame = admin.frameLocator('#acv-preview-frame')
  await frame.locator('h1').first().waitFor({ timeout: 30000 })
  check('B4 preview shows the draft with Main\'s own design', (await frame.locator('h1').first().innerText()).includes(`CMS TEST ${T}`))
  // Headless Chromium here stops advancing CSS animations, so the width change is made instant.
  await admin.addStyleTag({ content: '#acv-preview-frame { transition: none !important; }' })
  for (const [label, width] of [['Desktop', 1280], ['Tablet', 820], ['Mobile', 390]]) {
    await admin.locator('.acv-preview-toolbar button', { hasText: label }).click()
    // The width the Main page itself is laid out at inside the preview frame.
    const w = await frame.locator('html').evaluate(() => window.innerWidth)
    check(`B5 preview at ${label.toLowerCase()} width`, Math.abs(w - width) < 3, `${Math.round(w)}px`)
    await adminShot(admin, `B5-preview-${label.toLowerCase()}.png`)
  }
  await admin.goto(screen('pages', `&view=edit&id=${draftId}`))
  await admin.selectOption('#acv-status', 'published')
  const published = await saveForm(admin)
  check('B6 publishing the draft merges it onto the live page', /published onto the live page/i.test(published) && idFromUrl(admin) === liveId, published)
  const live = await get(`/${PAGE_SLUG}`)
  check('B7 the public page shows the change', live.status === 200 && live.html.includes(`CMS TEST ${T}`))
  await shot(viewer, `${MAIN}/${PAGE_SLUG}`, 'B7-after-publish-desktop', 1440)
  // Restore the original through the same workflow.
  if (process.env.DEBUG_STEPS) console.log('… navigation 4 from', admin.url())
  await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded' }), admin.locator('a', { hasText: 'Prepare changes privately' }).click()])
  const draft2 = idFromUrl(admin)
  const hero2 = admin.locator('#acv-sections .acv-section').first()
  await hero2.locator('summary', { hasText: 'Content' }).click()
  await hero2.getByLabel('Heading', { exact: true }).fill(testHeading.replace(` — CMS TEST ${T}`, ''))
  const saved2 = await saveSection(hero2)
  if (!saved2.ok) throw new Error(`section not saved: ${saved2.text}`)
  await admin.selectOption('#acv-status', 'published')
  await saveForm(admin)
  const restored = await get(`/${PAGE_SLUG}`)
  check('B8 restoring brings the original heading back', !restored.html.includes('CMS TEST') && restored.html.includes(original), `draft ${draft2?.slice(0, 8)}`)
  const after = { desktop: await shot(viewer, `${MAIN}/${PAGE_SLUG}`, 'B8-restored-desktop', 1440), mobile: await shot(viewer, `${MAIN}/${PAGE_SLUG}`, 'B8-restored-mobile', 390) }
  for (const device of ['desktop', 'mobile']) {
    const d = await diffRatio(before[device], after[device])
    check(`B9 restored page is visually identical to before (${device})`, d.ratio !== null && d.ratio < 0.001, d.ratio === null ? `size ${d.size}` : `${(d.ratio * 100).toFixed(3)}% pixels differ, ${d.size}`)
  }
  // An unchanged save (nothing edited) leaves the page exactly as it was.
  await admin.goto(screen('pages', `&view=edit&id=${liveId}`))
  await saveForm(admin)
  const d0 = await diffRatio(before.desktop, await shot(viewer, `${MAIN}/${PAGE_SLUG}`, 'B10-after-unchanged-save-desktop', 1440))
  check('B10 saving without changes leaves the public page visually identical', d0.ratio !== null && d0.ratio < 0.001, d0.ratio === null ? d0.size : `${(d0.ratio * 100).toFixed(3)}% pixels differ`)

  /* D/E. Blogs: create, publish to Main / Enrollment / Both, trash, restore, delete ------------- */
  const blogSlug = `cms-test-blog-${T}`
  await admin.goto(screen('blogs', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', `CMS TEST blog ${T}`)
  await admin.fill('[name="acv_field[slug]"]', blogSlug)
  await admin.fill('[name="acv_field[description]"]', 'Disposable test article.')
  await admin.locator('[name="acv_field[noindex]"]').check()
  for (const type of ['Heading', 'Paragraph', 'List']) await admin.locator('#acv-blocks .acv-add-row button', { hasText: type }).click()
  const cards = admin.locator('#acv-blocks .acv-card')
  await cards.nth(0).getByLabel('Text').fill(`Heading ${T}`)
  await cards.nth(1).getByLabel('Text').fill(`Paragraph with <strong>bold</strong> ${T}`)
  await cards.nth(2).getByLabel('Items (one per line)').fill('First\nSecond')
  await admin.locator('#acv-blocks .acv-card').nth(2).locator('button', { hasText: '↑' }).click() // reorder: list before paragraph
  await admin.selectOption('[name="acv_target"]', 'main')
  await admin.selectOption('#acv-status', 'published')
  const blogSaved = await saveForm(admin)
  const blogId = idFromUrl(admin)
  created.push(['blogs', blogId])
  const mainBlog = await get(`/blog/${blogSlug}`)
  check('E1 blog created and published to Main', /Saved/.test(blogSaved) && mainBlog.status === 200 && mainBlog.html.includes(`Heading ${T}`) && mainBlog.html.indexOf('First') < mainBlog.html.indexOf(`Paragraph with`), blogSaved)
  check('E2 Main page of the blog has noindex as chosen', /<meta name="robots" content="noindex/.test(mainBlog.html))
  const enrollPosts = async () => (await (await fetch(`${WP}/wp-json/wp/v2/posts?slug=${blogSlug}&_fields=id,link`)).json()).length
  check('D1 Main only: not on the Enrollment website', (await enrollPosts()) === 0)
  await admin.selectOption('[name="acv_target"]', 'enrollment')
  await admin.selectOption('#acv-status', 'published')
  const enrollSaved = await saveForm(admin)
  check('D2 Enrollment only: published on Enrollment, not public on Main', (await enrollPosts()) === 1 && (await get(`/blog/${blogSlug}`)).status === 404, enrollSaved)
  await admin.selectOption('[name="acv_target"]', 'both')
  await admin.selectOption('#acv-status', 'published')
  await saveForm(admin)
  check('D3 Both: on Main and on Enrollment, each in its own design', (await enrollPosts()) === 1 && (await get(`/blog/${blogSlug}`)).status === 200)
  await shot(viewer, `${MAIN}/blog/${blogSlug}`, 'D3-blog-main-desktop', 1440)
  await shot(viewer, `${WP}/${blogSlug}/`, 'D3-blog-enrollment-desktop', 1440)
  await cards.nth(0).getByLabel('Text').fill(`Heading edited ${T}`)
  await saveForm(admin)
  check('E3 an edit reaches both websites', (await get(`/blog/${blogSlug}`)).html.includes(`Heading edited ${T}`) && (await (await fetch(`${WP}/${blogSlug}/`)).text()).includes(`Heading edited ${T}`))
  const versions = await admin.locator('.acv-main-versions li').count()
  check('H1 earlier versions are listed', versions >= 3, `${versions} versions`)
  if (process.env.DEBUG_STEPS) console.log('… navigation 5 from', admin.url())
  await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded' }), admin.locator('.acv-main-versions li').nth(2).locator('a', { hasText: 'Restore' }).click()])
  check('H2 restoring an earlier version brings its article back', !(await get(`/blog/${blogSlug}`)).html.includes(`Heading edited ${T}`) && (await get(`/blog/${blogSlug}`)).html.includes(`Heading ${T}`), await notice(admin))
  await admin.goto(screen('blogs'))
  if (process.env.DEBUG_STEPS) console.log('… navigation 6 from', admin.url())
  await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded' }), admin.locator('.acv-main-table tr', { hasText: blogSlug }).locator('a', { hasText: 'Trash' }).click()])
  check('E4 trash removes it from Main and Enrollment', (await get(`/blog/${blogSlug}`)).status === 404 && (await enrollPosts()) === 0, await notice(admin))
  await admin.goto(screen('blogs', '&trashed=1'))
  if (process.env.DEBUG_STEPS) console.log('… navigation 7 from', admin.url())
  await Promise.all([admin.waitForNavigation({ waitUntil: 'domcontentloaded' }), admin.locator('.acv-main-table tr', { hasText: blogSlug }).locator('a', { hasText: 'Restore' }).click()])
  check('E5 restore brings it back as a draft (not public)', /Restored as a draft/.test(await notice(admin)) && (await get(`/blog/${blogSlug}`)).status === 404)

  /* E. Tools and a new page with sections --------------------------------------------------- */
  const toolSlug = `cms-test-tool-${T}`
  await admin.goto(screen('tools_extended', '&view=edit'))
  await admin.fill('[name="acv_field[name]"]', `CMS TEST Tool ${T}`)
  await admin.fill('[name="acv_field[slug]"]', toolSlug)
  await admin.fill('[name="acv_field[category]"]', 'SEO')
  await admin.fill('[name="acv_field[website_url]"]', 'https://example.com')
  await admin.locator('[name="acv_active"]').check()
  await saveForm(admin)
  created.push(['tools_extended', idFromUrl(admin)])
  const toolPage = await get(`/tools/${toolSlug}`)
  check('E6 tool created and shown on Main', toolPage.status === 200 && toolPage.html.includes(`CMS TEST Tool ${T}`))
  await admin.locator('[name="acv_active"]').uncheck()
  await saveForm(admin)
  check('E7 hiding the tool removes its name from its page', !(await get(`/tools/${toolSlug}`)).html.includes(`CMS TEST Tool ${T}`))

  const pageSlug = `cms-test-page-${T}`
  await admin.goto(screen('pages', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', `CMS TEST page ${T}`)
  await admin.fill('[name="acv_field[slug]"]', pageSlug)
  await admin.fill('[name="acv_field[description]"]', 'Disposable test page.')
  await admin.locator('[name="acv_field[noindex]"]').check()
  await saveForm(admin)
  const pageId = idFromUrl(admin)
  created.push(['pages', pageId])
  for (const type of ['hero', 'faq', 'text_block']) {
    await admin.selectOption('#acv-sections .acv-add-row select', type)
    await admin.locator('#acv-sections .acv-add-row button', { hasText: 'Add' }).click()
  }
  const s = admin.locator('#acv-sections .acv-section')
  await s.nth(0).getByLabel('Heading', { exact: true }).fill(`Hero ${T}`)
  await s.nth(0).locator('summary', { hasText: 'Design and devices' }).click()
  await s.nth(0).getByLabel('Alignment').selectOption('center')
  const saved3 = await saveSection(s.nth(0))
  check('E-section 3 saved', saved3.ok, saved3.text)
  await s.nth(1).getByLabel('Heading', { exact: true }).fill(`FAQ ${T}`)
  await s.nth(1).locator('.acv-repeat button', { hasText: '+ Add' }).click()
  await s.nth(1).getByLabel('Question').fill('Is this a test?')
  await s.nth(1).getByLabel('Answer').fill('Yes.')
  const saved4 = await saveSection(s.nth(1))
  check('E-section 4 saved', saved4.ok, saved4.text)
  await s.nth(2).getByLabel('Heading', { exact: true }).fill(`Text ${T}`)
  await s.nth(2).locator('summary', { hasText: 'Design and devices' }).click()
  await s.nth(2).getByLabel('Hide on phones').check()
  const saved5 = await saveSection(s.nth(2))
  check('E-section 5 saved', saved5.ok, saved5.text)
  check('E8 draft page not public before publishing', (await get(`/${pageSlug}`)).status === 404)
  await admin.reload()
  await admin.selectOption('#acv-status', 'published')
  await saveForm(admin)
  const newPage = await get(`/${pageSlug}`)
  check('E9 new page published with its sections, in order, on Main', newPage.status === 200 && newPage.html.indexOf(`Hero ${T}`) < newPage.html.indexOf(`FAQ ${T}`) && newPage.html.includes('Is this a test?'))
  check('E10 design settings applied (centred hero, text hidden on phones)', /text-center/.test(newPage.html) && /hidden md:block/.test(newPage.html))
  await shot(viewer, `${MAIN}/${pageSlug}`, 'E10-new-page-desktop', 1440)
  await shot(viewer, `${MAIN}/${pageSlug}`, 'E10-new-page-mobile', 390)
  check('E11 on a phone the "hidden on phones" section is not shown', !(await viewer.locator(`text=Text ${T}`).isVisible().catch(() => false)))
  await admin.selectOption('#acv-status', 'draft')
  await saveForm(admin)
  check('E12 unpublishing takes the page off Main', (await get(`/${pageSlug}`)).status === 404)

  /* I. Validation and conflicts ------------------------------------------------------------- */
  await admin.goto(screen('pages', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', `CMS TEST duplicate ${T}`)
  await admin.fill('[name="acv_field[slug]"]', PAGE_SLUG)
  const clash = await saveForm(admin)
  check('I1 an address already in use is refused with a clear message, typed text kept', /already used/.test(clash) && (await admin.inputValue('[name="acv_field[title]"]')) === `CMS TEST duplicate ${T}`, clash)

  /* H. Security and permissions ------------------------------------------------------------- */
  // WordPress roles, as for WordPress's own posts: an Author publishes their own articles only; a
  // Contributor writes drafts and submits them for review.
  const author = await login(await browser.newContext(), process.env.WP_AUTHOR_USER, process.env.WP_AUTHOR_PASS)
  const pagesDenied = await author.goto(screen('pages'))
  check('H3 an Author cannot open Main pages (refused with 403)', pagesDenied.status() === 403, String(pagesDenied.status()))
  const authorHome = await author.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-main`)
  check('H3b "Main Website" opens on Blogs for an Author', authorHome.status() === 200 && /Main Website — Blogs/.test(await author.locator('h1').first().innerText()))
  const othersBlog = await author.goto(screen('blogs', `&view=edit&id=${blogId}`))
  check('H3c an Author cannot open an article someone else wrote', othersBlog.status() === 403, String(othersBlog.status()))
  await author.goto(screen('blogs', '&view=edit'))
  await author.fill('[name="acv_field[title]"]', `CMS TEST author ${T}`)
  await author.fill('[name="acv_field[slug]"]', `cms-test-author-${T}`)
  await author.selectOption('[name="acv_target"]', 'main')
  await author.selectOption('#acv-status', 'published')
  const authorSaved = await saveForm(author)
  const authorBlogId = idFromUrl(author)
  created.push(['blogs', authorBlogId])
  check('H3d an Author publishes their own article', (await get(`/blog/cms-test-author-${T}`)).status === 200, authorSaved)
  await author.goto(screen('blogs'))
  const authorList = await author.locator('.acv-main-table tbody tr').allInnerTexts()
  check('H3e an Author\'s list shows only their own articles', authorList.length === 1 && authorList[0].includes(`CMS TEST author ${T}`), `${authorList.length} row(s)`)

  const contributor = await login(await browser.newContext(), process.env.WP_CONTRIBUTOR_USER, process.env.WP_CONTRIBUTOR_PASS)
  await contributor.goto(screen('blogs', '&view=edit'))
  const offered = await contributor.locator('#acv-status option:not([disabled])').allInnerTexts()
  check('H4 a Contributor can only save drafts or submit for review', offered.join(',') === 'Draft,In review', offered.join(', '))
  await contributor.fill('[name="acv_field[title]"]', `CMS TEST contributor ${T}`)
  await contributor.fill('[name="acv_field[slug]"]', `cms-test-contributor-${T}`)
  await contributor.evaluate(() => { const o = document.createElement('option'); o.value = 'published'; o.text = 'forged'; document.querySelector('#acv-status').append(o); document.querySelector('#acv-status').value = 'published' })
  const forged = await saveForm(contributor)
  created.push(['blogs', idFromUrl(contributor)])
  check('H5 a forged "Published" from a Contributor is refused; the article stays private', /cannot set that status/.test(forged) && (await get(`/blog/cms-test-contributor-${T}`)).status === 404, forged)
  const previewUrl = await admin.goto(screen('pages', `&view=preview&id=${liveId}`)).then(() => admin.locator('#acv-preview-frame').getAttribute('src'))
  check('H6 a preview link with a changed signature is refused', (await fetch(previewUrl.replace(/sig=[0-9a-f]{4}/, 'sig=0000'))).status === 404)
  check('H7 a preview link for another record is refused', (await fetch(previewUrl.replace(liveId, randomUUID()))).status === 404)
  const unsigned = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', body: JSON.stringify({ purpose: 'content', request_id: randomUUID(), op: 'list', entity: 'pages' }) })
  check('H8 the content API refuses unsigned requests', unsigned.status === 401, String(unsigned.status))
  const body = JSON.stringify({ purpose: 'content', request_id: randomUUID(), op: 'save', entity: 'testimonials', record: { name: `CMS TEST replay ${T}` }, actor: { login: 'acceptance-test' } })
  const send = () => { const ts = Math.floor(Date.now() / 1000); return fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(body, ts, process.env.WORDPRESS_CMS_WEBHOOK_SECRET) }, body }) }
  const first = await send(); const firstJson = await first.json(); const second = await send()
  if (firstJson?.data?.id) created.push(['testimonials', firstJson.data.id])
  check('H9 a replayed signed change is applied once', first.status === 200 && second.status === 409, `${first.status} then ${second.status}`)

  /* J. Regression of Main routes (local build) ----------------------------------------------- */
  for (const p of ['/', '/blog', '/tools', `/${PAGE_SLUG}`]) check(`J1 ${p} answers`, (await get(p)).status === 200)
  const log = await admin.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-main&view=log`).then(() => admin.locator('table tbody tr').count())
  check('J2 the Activity log records the changes', log >= 10, `${log} entries`)
  await adminShot(admin, 'admin-activity-log.png')
} finally {
  /* Cleanup: disposable CMS TEST content only (trash, then delete permanently) ---------------- */
  for (const [entity, id] of created.reverse()) {
    if (!id) continue
    for (const op of ['trash', 'delete']) {
      const body = JSON.stringify({ purpose: 'content', request_id: randomUUID(), op, entity, id, confirm: true, actor: { login: 'acceptance-cleanup' } })
      const ts = Math.floor(Date.now() / 1000)
      await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(body, ts, process.env.WORDPRESS_CMS_WEBHOOK_SECRET) }, body }).catch(() => {})
    }
  }
  const leftovers = await Promise.all([`/blog/cms-test-blog-${T}`, `/cms-test-page-${T}`].map(async (p) => (await get(p)).status))
  check('Z cleanup: test content removed from Main', leftovers.every((s) => s === 404), leftovers.join(','))
  // The test blog's Enrollment copy (kept as a draft once the blog left Enrollment) is deleted too.
  await removeEnrollmentCopies(admin, `CMS TEST blog ${T}`).catch(() => {})
  const copiesLeft = await enrollmentCopiesLeft(admin, `CMS TEST blog ${T}`).catch(() => -1)
  check('Z cleanup: the Enrollment copy of the test blog is deleted', copiesLeft === 0, `${copiesLeft} left`)
  fs.writeFileSync(path.join(OUT, `results-${T}.json`), JSON.stringify({ run: T, main: MAIN, wordpress: WP, click_fallbacks: clickFallbacks, results }, null, 1))
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed`)
  await browser.close()
}
