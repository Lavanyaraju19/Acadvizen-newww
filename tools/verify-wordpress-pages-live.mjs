// Live check of the administrator workflow for a Main page in the Enrollment WordPress admin
// (Acadvizen Master Admin → Main Website → Pages), on ONE disposable, labelled, noindex page that is
// removed at the end through the same screens:
//   create → draft private → sections → preview in the editor → publish → private copy edited → live
//   unchanged until published → update live → address clash refused → unpublish → trash → delete.
//   node tools/verify-wordpress-pages-live.mjs
// Sign-in: WP_STORAGE_STATE (a saved session file) or WP_PROD_USER / WP_PROD_PASS from
// ~/.acadvizen-production.env (one attempt). Override the addresses with WP_URL and MAIN_URL.
// Screenshots (admin bar hidden) go to EVIDENCE_DIR when set. Prints no credential.
// KEEP_TEST_ITEM=1 keeps the test page as an unpublished draft instead of deleting it (it is still
// unpublished at the end, also after an error, and the public address is checked to be 404).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { signPayload } from '../lib/wordpress/signature.js'

const file = path.join(os.homedir(), '.acadvizen-production.env')
const env = fs.existsSync(file)
  ? Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(?:'([^']*)'|(\S*))/)).filter(Boolean).map((m) => [m[1], m[2] ?? m[3]]))
  : {}
process.env.WP_URL ||= 'https://enroll.acadvizen.com'
process.env.MAIN_URL ||= 'https://www.acadvizen.com'
const { WP, MAIN, T, screen, get, launch, login, saveForm, notice } = await import('../tests/wordpress/acceptanceKit.mjs')
const LEVEL = /localhost|127\.0\.0\.1/.test(`${WP} ${MAIN}`) ? 'LOCAL' : 'PRODUCTION'
const OUT = process.env.EVIDENCE_DIR || ''
const KEEP = process.env.KEEP_TEST_ITEM === '1'
if (OUT) fs.mkdirSync(OUT, { recursive: true })

let pass = 0
let fail = 0
const results = []
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++
  results.push({ name, ok: Boolean(ok), detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} [${LEVEL}] ${name}${detail ? ` — ${detail}` : ''}`)
}
async function eventually(fn, tries = 10) {
  let last
  for (let i = 0; i < tries; i++) {
    last = await fn()
    if (last === true) return true
    await new Promise((r) => setTimeout(r, 2000))
  }
  return last
}
async function shot(page, name) {
  if (!OUT) return
  await page.addStyleTag({ content: '#wpadminbar{visibility:hidden!important}' }).catch(() => {})
  await page.screenshot({ path: path.join(OUT, `${name}.png`), timeout: 20000, animations: 'disabled' }).catch((e) => console.log(`  (screenshot ${name} not taken: ${e.message.split('\n')[0]})`))
}
// Last-resort cleanup only (the normal cleanup is the admin's own Trash / Delete permanently).
function readSecret() {
  const line = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith('ACADVIZEN_CMS_WEBHOOK_SECRET=')) : ''
  const m = line ? line.slice(line.indexOf('=') + 1).match(/^'([^']*)'/) : null
  return process.env.WORDPRESS_CMS_WEBHOOK_SECRET || (m ? m[1] : '')
}
async function apiCleanup(id) {
  const secret = readSecret()
  if (!secret || !id) return 'skipped'
  const out = []
  for (const op of ['trash', 'delete']) {
    const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'acceptance-cleanup' }, op, entity: 'pages', id, confirm: true })
    const ts = Math.floor(Date.now() / 1000)
    const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, secret) }, body: raw }).catch(() => ({ status: 0 }))
    out.push(`${op} ${r.status}`)
  }
  return out.join(', ')
}

const { browser, counter } = await launch()
let admin
if (process.env.WP_STORAGE_STATE) {
  admin = await (await browser.newContext({ storageState: process.env.WP_STORAGE_STATE, viewport: { width: 1440, height: 1100 } })).newPage()
  admin.on('dialog', (d) => d.accept())
  const goto = admin.goto.bind(admin)
  admin.goto = (url, options = {}) => goto(url, { waitUntil: 'domcontentloaded', timeout: 120000, ...options })
} else {
  admin = await login(browser, process.env.WP_USER || env.WP_PROD_USER, process.env.WP_PASS || env.WP_PROD_PASS)
}
await admin.goto(screen('pages'))
const signedIn = new URL(admin.url()).pathname.startsWith('/wp-admin')
check('administrator signed in and Main Website → Pages opened', signedIn)
if (!signedIn) { await browser.close(); process.exit(1) }
const viewer = await (await browser.newContext()).newPage()
await viewer.route('**/*', (r) => (/facebook|google|doubleclick|clarity|hotjar|vercel-insights/.test(new URL(r.request().url()).host) ? r.abort() : r.continue()))

const SLUG = `cms-production-test-page-${T}`
const TITLE = `CMS PRODUCTION TEST page ${T}`
const idFromUrl = () => new URL(admin.url()).searchParams.get('id') || ''
let pageId = ''
let draftId = ''
const existing = await (async () => {
  // A real published Main page, used only to prove an address clash is refused (never edited).
  const row = admin.locator('.acv-main-table tbody tr', { hasText: 'Published' }).first()
  return (await row.innerText().catch(() => '')).match(/\s(\/[a-z0-9-]+)\s/)?.[1] || ''
})()
try {
  /* 1. Create a page as a draft, with sections ------------------------------------------------ */
  await admin.goto(screen('pages', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', TITLE)
  await admin.fill('[name="acv_field[slug]"]', SLUG)
  await admin.fill('[name="acv_field[description]"]', `Disposable production acceptance page ${T}; removed after the check.`)
  await admin.locator('[name="acv_field[noindex]"]').check()
  const created = await saveForm(admin)
  pageId = idFromUrl()
  check('P1 page created as a draft from the admin', /Saved/.test(created) && Boolean(pageId), created)
  for (const type of ['hero', 'text_block']) {
    await admin.selectOption('#acv-sections .acv-add-row select', type)
    await admin.locator('#acv-sections .acv-add-row button', { hasText: 'Add' }).click()
  }
  const sections = admin.locator('#acv-sections .acv-section')
  await sections.nth(0).getByLabel('Heading', { exact: true }).fill(`Hero ${T}`)
  const saveSection = async (card) => {
    await card.locator('button', { hasText: 'Save section' }).click()
    const status = card.locator('.acv-section-status--ok, .acv-section-status--error')
    await status.waitFor({ timeout: 60000 })
    return { ok: (await status.getAttribute('class')).includes('--ok'), text: await status.innerText() }
  }
  const s1 = await saveSection(sections.nth(0))
  await sections.nth(1).getByLabel('Heading', { exact: true }).fill(`Text ${T}`)
  const s2 = await saveSection(sections.nth(1))
  check('P2 two sections (hero, text) saved', s1.ok && s2.ok, `${s1.text} / ${s2.text}`)
  await shot(admin, 'p2-admin-page-editor')
  check('P3 a draft is not public on Main', (await get(`/${SLUG}`)).status === 404)

  /* 2. Preview inside the editor (Main's own design, framed by WordPress) ---------------------- */
  await admin.goto(screen('pages', `&view=preview&id=${pageId}`))
  const frame = admin.frameLocator('#acv-preview-frame')
  const previewOk = await frame.locator('h1').first().waitFor({ timeout: 60000 }).then(() => true).catch(() => false)
  const previewText = previewOk ? await frame.locator('h1').first().innerText() : ''
  check('P4 editor preview shows the draft in Main\'s design', previewOk && previewText.includes(`Hero ${T}`), previewText.slice(0, 60))
  await shot(admin, 'p4-admin-preview')

  /* 3. Publish ---------------------------------------------------------------------------------- */
  await admin.goto(screen('pages', `&view=edit&id=${pageId}`))
  await admin.selectOption('#acv-status', 'published')
  const published = await saveForm(admin)
  const live = await eventually(async () => { const p = await get(`/${SLUG}`); return p.status === 200 && p.html.includes(`Hero ${T}`) && p.html.includes(`Text ${T}`) })
  check('P5 published: the public Main URL shows both sections', live === true, published)
  const html = (await get(`/${SLUG}`)).html
  check('P6 SEO on the public page: title, noindex, canonical to its own address', html.includes(`<title>${TITLE}`) || html.includes(TITLE), [`robots=${html.match(/<meta name="robots" content="([^"]+)"/)?.[1] || ''}`, `canonical=${html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || ''}`].join(' '))
  check('P7 noindex test page is kept out of search engines and the sitemap', /noindex/.test(html.match(/<meta name="robots" content="([^"]+)"/)?.[1] || '') && !(await (await fetch(`${MAIN}/sitemap.xml?t=${Date.now()}`)).text()).includes(SLUG))
  if (OUT) {
    for (const [w, name] of [[1440, 'p5-public-desktop'], [390, 'p5-public-mobile']]) {
      await viewer.setViewportSize({ width: w, height: 900 })
      await viewer.goto(`${MAIN}/${SLUG}?t=${Date.now()}`, { waitUntil: 'load', timeout: 120000 })
      await viewer.waitForTimeout(1500)
      await viewer.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true, timeout: 60000 }).catch(() => {})
    }
  }

  /* 4. Change the live page safely: private copy, live unchanged until published ----------------- */
  await admin.goto(screen('pages', `&view=edit&id=${pageId}`))
  const prepare = admin.locator('a', { hasText: 'Prepare changes privately' })
  const href = await prepare.getAttribute('href').catch(() => '')
  if (href) await admin.goto(new URL(href, `${WP}/wp-admin/`).href)
  draftId = idFromUrl()
  check('P8 "Prepare changes privately" opens a private copy', Boolean(draftId) && draftId !== pageId, await notice(admin))
  const copy = admin.locator('#acv-sections .acv-section').first()
  await copy.locator('summary', { hasText: 'Content' }).click().catch(() => {})
  await copy.getByLabel('Heading', { exact: true }).fill(`Hero updated ${T}`)
  const s3 = await saveSection(copy)
  const during = await get(`/${SLUG}`)
  check('P9 while the change is private, the live page is unchanged', s3.ok && during.status === 200 && during.html.includes(`Hero ${T}`) && !during.html.includes(`Hero updated ${T}`), s3.text)
  await admin.selectOption('#acv-status', 'published')
  const merged = await saveForm(admin)
  const updated = await eventually(async () => (await get(`/${SLUG}`)).html.includes(`Hero updated ${T}`))
  check('P10 publishing the private copy updates the live page (cache refreshed)', updated === true, merged)
  const second = await get(`/${SLUG}?again=1`)
  check('P11 a fresh request also gets the updated page', second.html.includes(`Hero updated ${T}`) && !second.html.includes(`Hero ${T}<`))

  /* 5. Address clash -------------------------------------------------------------------------- */
  if (existing) {
    const before = await get(existing)
    await admin.goto(screen('pages', '&view=edit'))
    await admin.fill('[name="acv_field[title]"]', `CMS PRODUCTION TEST clash ${T}`)
    await admin.fill('[name="acv_field[slug]"]', existing.slice(1))
    const clash = await saveForm(admin)
    const after = await get(existing)
    check('P12 an address already used on Main is refused, nothing is overwritten', /already used|address/i.test(clash) && !new URL(admin.url()).searchParams.get('id') && after.status === before.status, `${existing}: ${clash.slice(0, 90)}`)
  } else {
    check('P12 address clash', false, 'no published page found to test against')
  }

  /* 6. Unpublish ------------------------------------------------------------------------------- */
  await admin.goto(screen('pages', `&view=edit&id=${pageId}`))
  await admin.selectOption('#acv-status', 'draft')
  await saveForm(admin)
  check('P13 unpublishing takes the page off Main', (await eventually(async () => (await get(`/${SLUG}`)).status === 404)) === true)
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  if (KEEP) {
    /* 7. Keep the test page, unpublished (no Trash, no Delete permanently) ---------------------- */
    if (pageId && (await get(`/${SLUG}`)).status !== 404) {
      await admin.goto(screen('pages', `&view=edit&id=${pageId}`)).catch(() => {})
      await admin.selectOption('#acv-status', 'draft').catch(() => {})
      await saveForm(admin).catch(() => {})
    }
    await admin.goto(screen('pages', `&s=${SLUG}`)).catch(() => {})
    const rows = await admin.locator('.acv-main-table tr', { hasText: SLUG }).allInnerTexts().catch(() => [])
    check('K1 test page kept in the admin, unpublished (not deleted)', rows.length > 0 && rows.every((r) => !/Published/.test(r)), `${rows.length} row(s): ${rows.map((r) => r.replace(/\s+/g, ' ').slice(0, 80)).join(' | ')}`)
    check('Z2 test address answers 404 (not public)', (await eventually(async () => (await get(`/${SLUG}`)).status === 404)) === true)
    check('Z3 test address is not in the sitemap', !(await (await fetch(`${MAIN}/sitemap.xml?t=${Date.now()}`)).text()).includes(SLUG))
    if (OUT) fs.writeFileSync(path.join(OUT, `pages-results-${T}.json`), JSON.stringify({ run: T, level: LEVEL, wp: WP, main: MAIN, kept: { pageId, draftId, slug: SLUG }, click_fallbacks: counter.fallbacks, results }, null, 1))
    await browser.close()
    console.log(`\n${pass} passed, ${fail} failed [${LEVEL}] | test page /${SLUG} KEPT unpublished (id ${pageId || '-'}${draftId ? `, private copy ${draftId}` : ''}) | click fallbacks ${counter.fallbacks}`)
    process.exit(fail ? 1 : 0)
  }
  /* 7. Cleanup through the admin's own Trash and Delete permanently ----------------------------- */
  for (const status of ['', '&trashed=1']) {
    await admin.goto(screen('pages', `${status}&s=${SLUG}`)).catch(() => {})
    for (const label of status ? ['Delete permanently'] : ['Trash']) {
      for (let i = 0; i < 3; i++) {
        const link = admin.locator('.acv-main-table tr', { hasText: SLUG }).first().locator('a', { hasText: label })
        const target = await link.getAttribute('href').catch(() => '')
        if (!target) break
        await admin.goto(new URL(target, `${WP}/wp-admin/`).href)
        await admin.goto(screen('pages', `${status}&s=${SLUG}`))
      }
    }
  }
  await admin.goto(screen('pages', `&s=${SLUG}`))
  const listed = await admin.locator('.acv-main-table tr', { hasText: SLUG }).count()
  await admin.goto(screen('pages', `&trashed=1&s=${SLUG}`))
  const trashed = await admin.locator('.acv-main-table tr', { hasText: SLUG }).count()
  let fallback = ''
  if (listed + trashed) fallback = `admin cleanup incomplete; API cleanup: ${await apiCleanup(pageId)}${draftId ? ` / copy ${await apiCleanup(draftId)}` : ''}`
  check('Z1 test page removed through Trash and Delete permanently (list and trash empty)', listed + trashed === 0, fallback || '0 listed, 0 in trash')
  check('Z2 test address answers 404 after cleanup', (await eventually(async () => (await get(`/${SLUG}`)).status === 404)) === true)
  check('Z3 test address is not in the sitemap', !(await (await fetch(`${MAIN}/sitemap.xml?t=${Date.now()}`)).text()).includes(SLUG))
  if (OUT) fs.writeFileSync(path.join(OUT, `pages-results-${T}.json`), JSON.stringify({ run: T, level: LEVEL, wp: WP, main: MAIN, click_fallbacks: counter.fallbacks, results }, null, 1))
  await browser.close()
  console.log(`\n${pass} passed, ${fail} failed [${LEVEL}] | test page /${SLUG} | click fallbacks ${counter.fallbacks}`)
  process.exit(fail ? 1 : 0)
}
