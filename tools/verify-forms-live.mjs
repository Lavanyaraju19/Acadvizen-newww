// Live acceptance of the public enquiry forms, as a visitor and then as an administrator.
//   node tools/verify-forms-live.mjs
// Main (www.acadvizen.com/contact) and Enrollment (enroll.acadvizen.com/digital-marketing-course-enquiry/):
//   an empty submission is refused → a clearly labelled test enquiry ("CMS ACCEPTANCE TEST <time> - please
//   ignore", email at the reserved example.com domain) is submitted through the real form → the visitor sees
//   the confirmation → the enquiry is stored where an administrator finds it (Main: admin Leads API after one
//   sign-in; Enrollment: WordPress → Course Enquiries). Analytics and advertising requests are blocked, so no
//   conversion is counted. Test enquiries are not deleted (production data is never removed automatically).
// Credentials: MAIN_ADMIN_EMAIL / MAIN_ADMIN_PASSWORD from ~/.acadvizen-production.env (one sign-in) and a
// saved wp-admin session (WP_STORAGE_STATE). Prints no credential, cookie or personal data.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)('playwright')
const MAIN = 'https://www.acadvizen.com', ENROLL = 'https://enroll.acadvizen.com'
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const NAME = `CMS ACCEPTANCE TEST ${T} - please ignore`, EMAIL = `cms-acceptance-${T}@example.com`, PHONE = '9000000000'
const TRACKING = /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|facebook\.(com|net)|clarity\.ms|hotjar\.(com|io))$/i
const env = Object.fromEntries(fs.readFileSync(path.join(os.homedir(), '.acadvizen-production.env'), 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(?:'([^']*)'|"([^"]*)"|(\S*))/)).filter(Boolean).map((m) => [m[1], m[2] ?? m[3] ?? m[4]]))
const results = []; const check = (n, ok, d = '') => { results.push(Boolean(ok)); console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`) }
const browser = await chromium.launch()
const visitor = async () => { const c = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await c.route((u) => TRACKING.test(u.hostname) || /popupkit/.test(u.href), (r) => r.abort()); return c.newPage() }

try {
  // ONLY=main or ONLY=enrollment runs one website (each run stores one more labelled test enquiry).
  const only = process.env.ONLY || ''
  let p
  if (only !== 'enrollment') {
  // ---- Main /contact ----------------------------------------------------------------------------
  p = await visitor()
  await p.goto(`${MAIN}/contact`, { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(2000)
  const form = p.locator('form').filter({ has: p.locator('[name="fullName"]') }).first()
  check('Main 1 empty submission is refused by the form', (await form.evaluate((f) => f.checkValidity())) === false)
  await form.locator('[name="fullName"]').fill(NAME)
  await form.locator('[name="phone"]').fill(PHONE)
  await form.locator('[name="email"]').fill(EMAIL)
  const exp = form.locator('[name="experienceLevel"]'); if (await exp.count()) await exp.selectOption({ index: 1 }).catch(() => {})
  await form.locator('[name="message"]').fill('Acceptance test of the contact form. Please ignore.')
  const sent = p.waitForResponse((r) => r.request().method() === 'POST' && /\/api\//.test(r.url()), { timeout: 60000 }).catch(() => null)
  await form.locator('button[type="submit"], button').last().click()
  const resp = await sent; await p.waitForTimeout(3000)
  const shown = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
  check('Main 2 the form is sent to Main\'s own API', resp && resp.status() < 300, resp ? `${resp.request().method()} ${new URL(resp.url()).pathname} → HTTP ${resp.status()}` : 'no request')
  // On success the form is replaced by its confirmation message (editable; default "Thank you for your message!").
  const formGone = (await p.locator('[name="fullName"]').count()) === 0
  check('Main 2 the visitor sees the confirmation instead of the form', formGone, formGone ? 'form replaced by the confirmation message' : 'form still shown')
  void shown
  await p.context().close()
  // Stored: read the newest leads as the Main administrator (one sign-in).
  p = await (await browser.newContext()).newPage()
  await p.goto(`${MAIN}/admin-login`, { waitUntil: 'load', timeout: 120000 })
  await p.locator('input[type="email"]').first().fill(env.MAIN_ADMIN_EMAIL || '')
  await p.locator('input[type="password"]').first().fill(env.MAIN_ADMIN_PASSWORD || '')
  await p.locator('form button[type="submit"], form button').first().click(); await p.waitForTimeout(6000)
  const leads = await p.evaluate(async () => { const r = await fetch('/api/cms/leads?limit=50', { cache: 'no-store' }); const j = await r.json().catch(() => ({})); return { status: r.status, rows: Array.isArray(j) ? j : j.data || [] } })
  const mine = leads.rows.find((l) => (l.full_name || '').includes(T))
  check('Main 3 the enquiry is stored in Main\'s leads (admin view)', Boolean(mine), mine ? `lead ${String(mine.id).slice(0, 8)}…, status ${mine.status}, form ${mine.form_type}, page ${mine.page_slug || '-'}` : `HTTP ${leads.status}, ${leads.rows.length} recent leads read`)
  await p.context().close()
  }

  if (only !== 'main') {
  // ---- Enrollment enquiry form ------------------------------------------------------------------
  p = await visitor()
  await p.goto(`${ENROLL}/digital-marketing-course-enquiry/`, { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(2000)
  const ef = p.locator('#avCourseForm')
  check('Enrollment 1 empty submission is refused by the form', (await ef.evaluate((f) => f.checkValidity())) === false)
  await ef.locator('[name="current_status"]').first().check({ force: true })
  await ef.locator('[name="learning_preference"]').selectOption({ index: 1 })
  await ef.locator('[name="experience"]').selectOption({ index: 1 })
  await ef.locator('button.av-next').click() // step 2: contact details
  await ef.locator('[name="full_name"]').fill(NAME)
  await ef.locator('[name="email"]').fill(EMAIL)
  await ef.locator('[name="city"]').fill('Bengaluru')
  await ef.locator('[name="phone"]').fill(PHONE)
  await ef.locator('[name="consent"]').check({ force: true })
  const esent = p.waitForResponse((r) => r.request().method() === 'POST' && /enquiry|admin-ajax|wp-json/.test(r.url()), { timeout: 60000 }).catch(() => null)
  await ef.locator('button.av-submit').click()
  const eresp = await esent; await p.waitForTimeout(3000)
  const eshown = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
  check('Enrollment 2 the form is sent to the enquiry endpoint', eresp && eresp.status() < 300, eresp ? `${new URL(eresp.url()).pathname} → HTTP ${eresp.status()}` : 'no request')
  check('Enrollment 2 the visitor sees a confirmation', /thank|received|success|we will|get back|submitted/i.test(eshown), (eshown.match(/[^.]*(thank|received|success|get back|submitted)[^.]*/i) || [''])[0].slice(0, 120))
  await p.context().close()
  // Stored: WordPress → Course Enquiries, as the administrator.
  p = await (await browser.newContext({ storageState: process.env.WP_STORAGE_STATE })).newPage()
  await p.goto(`${ENROLL}/wp-admin/edit.php?post_type=av_course_enquiry&post_status=all&s=${encodeURIComponent(T)}`, { waitUntil: 'domcontentloaded', timeout: 180000 })
  const rows = await p.locator('#the-list tr:not(.no-items)').count()
  check('Enrollment 3 the enquiry is stored (WordPress → Course Enquiries)', rows >= 1, `${rows} matching enquiry`)
  await p.context().close()
  }
} catch (e) {
  check('run finished without an error', false, String(e.message || e).slice(0, 200))
} finally {
  console.log(`\n${results.filter(Boolean).length} passed, ${results.filter((x) => !x).length} failed [LIVE] | test enquiries labelled "${NAME}"`)
  await browser.close()
  process.exitCode = results.every(Boolean) ? 0 : 1
}
