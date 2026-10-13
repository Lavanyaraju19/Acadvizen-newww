// LOCAL acceptance test: "Publish To: Both" when one destination fails.
// Needs the local test harness mu-plugin local-enrollment-copy-failure.php (WordPress refuses to store
// the Enrollment copy of a blog whose title contains ENROLL-FAIL). Never run against production.
//   STEP=main-down  run while the local Main is stopped: the save must fail visibly, nothing created
//   (default)       C1 Main refuses, C2 Enrollment copy fails, C3 retry after the cause is fixed
import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { signPayload } from '../../lib/wordpress/signature.js'

const { WP, MAIN, T, screen, get, launch, login, saveForm, removeEnrollmentCopies, enrollmentCopiesLeft } = await import('./acceptanceKit.mjs')
if (/acadvizen\.com/.test(WP) || /acadvizen\.com/.test(MAIN)) { console.log('Refusing to run against a live site.'); process.exit(2) }

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
// The plugin's own notice is the one carrying its message; WordPress and other plugins add notices too.
const own = (page) => page.evaluate(() => {
  const re = /Main Website|Enrollment Website|address|already|could not|not reachable|connection/i
  const box = document.querySelector('.acv-cms-flash') || [...document.querySelectorAll('.notice')].find((n) => re.test(n.textContent || ''))
  return box ? { kind: (box.className.match(/notice-(success|warning|error)/) || [])[1] || 'none', text: (box.textContent || '').replace(/\s+/g, ' ').trim() } : { kind: 'none', text: '' }
})
const kind = async (page) => (await own(page)).kind
const text = async (page) => (await own(page)).text
const signed = async (body) => {
  const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'both-failure-test' }, ...body })
  const ts = Math.floor(Date.now() / 1000)
  const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, process.env.WORDPRESS_CMS_WEBHOOK_SECRET) }, body: raw })
  return r.json().catch(() => ({}))
}

const { browser } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const fillBlog = async (title, slug, target = 'both', status = 'published') => {
  await admin.goto(screen('blogs', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', title)
  await admin.fill('[name="acv_field[slug]"]', slug)
  await admin.locator('#acv-blocks .acv-add-row button', { hasText: 'Heading' }).click()
  await admin.locator('#acv-blocks .acv-card').nth(0).getByLabel('Text').fill(`Heading ${title}`)
  await admin.selectOption('[name="acv_target"]', target)
  await admin.selectOption('#acv-status', status)
}
const created = []

try {
  if (process.env.STEP === 'main-down') {
    const title = `CMS TEST both main-down ${T}`
    await fillBlog(title, `cms-test-both-down-${T}`)
    await saveForm(admin)
    const k = await kind(admin)
    check('C0 Main unreachable: a red message in plain language (nothing changed, try again)', k === 'error' && /could not be reached, so nothing was changed/.test(await text(admin)), `${k}: ${await text(admin)}`)
    check('C0 the typed title is kept for a retry', (await admin.inputValue('[name="acv_field[title]"]').catch(() => '')) === title)
    check('C0 no Enrollment copy was created', (await enrollmentCopiesLeft(admin, title)) === 0)
  } else {
    // C1: Main refuses (the address belongs to an existing published blog). Nothing may change anywhere.
    const listed = await signed({ op: 'list', entity: 'blogs', limit: 50 })
    const existing = (listed.data || []).find((b) => b.status === 'published' && b.slug)
    const before = existing ? await get(`/blog/${existing.slug}`) : null
    const t1 = `CMS TEST both clash ${T}`
    await fillBlog(t1, existing?.slug || 'missing-existing-blog')
    await saveForm(admin)
    const k1 = await kind(admin)
    check('C1 Main refuses (address in use): red message, not success', k1 === 'error' && /already|in use|taken/i.test(await text(admin)), `${k1}: ${await text(admin)}`)
    check('C1 no Enrollment copy was created', (await enrollmentCopiesLeft(admin, t1)) === 0)
    const after = existing ? await get(`/blog/${existing.slug}`) : null
    check('C1 the existing blog on Main is unchanged', !!existing && before.status === 200 && after.status === 200 && after.html.includes(existing.title) && !after.html.includes(t1), existing?.slug)

    // C2: Main succeeds, the Enrollment copy fails. The notice must not claim success.
    const slug2 = `cms-test-both-partial-${T}`
    const t2 = `CMS TEST ENROLL-FAIL both ${T}`
    await fillBlog(t2, slug2)
    await saveForm(admin)
    const id = new URL(admin.url()).searchParams.get('id')
    if (id) created.push(id)
    const k2 = await kind(admin)
    const n2 = await text(admin)
    check('C2 partial failure is shown as a warning, not as success', k2 === 'warning', `${k2}: ${n2}`)
    check('C2 the message names the failed destination', /Enrollment Website copy failed/.test(n2) && /Saved on the Main Website/.test(n2))
    check('C2 Main did publish (reported accurately)', (await get(`/blog/${slug2}`)).status === 200)
    check('C2 no Enrollment copy exists', (await enrollmentCopiesLeft(admin, t2)) === 0)

    // C3: the cause is fixed (title without the marker); saving again creates exactly one copy.
    const t3 = `CMS TEST both retried ${T}`
    await admin.goto(screen('blogs', `&view=edit&id=${id}`))
    await admin.fill('[name="acv_field[title]"]', t3)
    await saveForm(admin)
    const k3 = await kind(admin)
    check('C3 retry succeeds on both: success notice naming Enrollment', k3 === 'success' && /Enrollment Website: updated/.test(await text(admin)), `${k3}: ${await text(admin)}`)
    check('C3 exactly one Enrollment copy', (await enrollmentCopiesLeft(admin, t3)) === 1)
    await admin.goto(screen('blogs', `&view=edit&id=${id}`))
    await saveForm(admin)
    check('C3 saving again does not duplicate the Enrollment copy', (await enrollmentCopiesLeft(admin, t3)) === 1)
    check('C3 Main still serves the blog once', (await get(`/blog/${slug2}`)).status === 200)
  }
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
  console.log('  at', admin.url())
  await admin.screenshot({ path: path.join(process.env.EVIDENCE_DIR || os.tmpdir(), `both-failure-error-${T}.png`) }).catch(() => {})
} finally {
  for (const id of created) for (const op of ['trash', 'delete']) await signed({ op, entity: 'blogs', id, confirm: true })
  for (const t of [`CMS TEST both retried ${T}`, `CMS TEST ENROLL-FAIL both ${T}`, `CMS TEST both clash ${T}`, `CMS TEST both main-down ${T}`]) await removeEnrollmentCopies(admin, t).catch(() => {})
  if (created.length) check('Z cleanup: the test blog is gone from Main', (await get(`/blog/cms-test-both-partial-${T}`)).status === 404)
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed [LOCAL]`)
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
  await browser.close()
}
