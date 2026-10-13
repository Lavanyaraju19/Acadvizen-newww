// LOCAL acceptance test: Main Website redirects managed in Acadvizen Master Admin → Main Website → Redirects.
// Checks the real effect on the Main Website (its middleware answers the redirect). Never run against production.
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { signPayload } from '../../lib/wordpress/signature.js'

const { WP, MAIN, T, screen, launch, login, saveForm } = await import('./acceptanceKit.mjs')
if (/acadvizen\.com/.test(WP) || /acadvizen\.com/.test(MAIN)) { console.log('Refusing to run against a live site.'); process.exit(2) }
const DB = process.env.LOCAL_DB_CONTAINER
if (!DB) { console.log('LOCAL_DB_CONTAINER is required.'); process.exit(2) }

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const sql = (query) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-tAc', query], { encoding: 'utf8', env: { ...process.env, MSYS_NO_PATHCONV: '1' } }).trim()
const signed = async (body) => {
  const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'redirect-test' }, ...body })
  const ts = Math.floor(Date.now() / 1000)
  const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, process.env.WORDPRESS_CMS_WEBHOOK_SECRET) }, body: raw })
  return r.json().catch(() => ({}))
}
const head = async (path) => { const r = await fetch(`${MAIN}${path}`, { redirect: 'manual' }); return { status: r.status, location: r.headers.get('location') || '' } }
const flash = (page) => page.evaluate(() => {
  const box = document.querySelector('.acv-cms-flash')
  return box ? { kind: (box.className.match(/notice-(success|warning|error)/) || [])[1] || 'none', text: (box.textContent || '').replace(/\s+/g, ' ').trim() } : { kind: 'none', text: '' }
})

const FROM = `/cms-test-old-${T}`
const PAGE_SLUG = `cms-test-live-${T}`
const { browser } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const ids = []
let pageId = null

try {
  // R1. New redirect from WordPress: saved switched off, so nothing happens yet.
  await admin.goto(screen('redirects', '&view=edit'))
  await admin.fill('[name="acv_field[from_path]"]', `${FROM}/`)
  await admin.fill('[name="acv_field[to_path]"]', '/courses')
  await admin.selectOption('[name="acv_field[status_code]"]', '301')
  await saveForm(admin)
  const id = new URL(admin.url()).searchParams.get('id')
  if (id) ids.push(id)
  check('R1 saved from WordPress, stored without the trailing slash, switched off', Boolean(id) && sql(`select from_path || '|' || is_active from public.redirects where id = '${id}'`) === `${FROM}|false`)
  check('R1 a switched-off redirect does nothing on Main', (await head(FROM)).status === 404)

  // R2. Switched on: Main answers with the redirect.
  await admin.locator('input[name="acv_active"]').check()
  await saveForm(admin)
  const on = await head(FROM)
  check('R2 switched on: Main redirects the old address (301 to /courses)', on.status === 301 && /\/courses$/.test(on.location), `${on.status} ${on.location}`)

  // R3. A redirect cannot hide a published page.
  const page = await signed({ op: 'save', entity: 'pages', record: { title: `CMS TEST live ${T}`, slug: PAGE_SLUG, noindex: true } })
  pageId = page?.data?.id
  await signed({ op: 'set_status', entity: 'pages', id: pageId, status: 'published' })
  await admin.goto(screen('redirects', '&view=edit'))
  await admin.fill('[name="acv_field[from_path]"]', `/${PAGE_SLUG}`)
  await admin.fill('[name="acv_field[to_path]"]', '/courses')
  await saveForm(admin)
  const f3 = await flash(admin)
  check('R3 redirecting a published page is refused with a clear message', f3.kind === 'error' && /published page or blog lives at this address/.test(f3.text), f3.text.slice(0, 100))
  check('R3 the published page still answers', (await head(`/${PAGE_SLUG}`)).status === 200)

  // R4. System addresses and chains are refused.
  await admin.goto(screen('redirects', '&view=edit'))
  await admin.fill('[name="acv_field[from_path]"]', '/admin')
  await admin.fill('[name="acv_field[to_path]"]', '/courses')
  await saveForm(admin)
  check('R4 the admin address cannot be redirected', /belongs to the website itself/.test((await flash(admin)).text))
  await admin.goto(screen('redirects', '&view=edit'))
  await admin.fill('[name="acv_field[from_path]"]', `/cms-test-chain-${T}`)
  await admin.fill('[name="acv_field[to_path]"]', FROM)
  await saveForm(admin)
  check('R4 a redirect to an address that is itself redirected is refused (no chains)', /chain of redirects/.test((await flash(admin)).text))

  // R5. Deleting: refused while switched on; works after switching off and confirming.
  const del = await signed({ op: 'delete', entity: 'redirects', id, confirm: true })
  check('R5 a switched-on redirect cannot be deleted', del.error === 'still_active')
  await admin.goto(screen('redirects', `&view=edit&id=${id}`))
  await admin.locator('input[name="acv_active"]').uncheck()
  await saveForm(admin)
  check('R5 switched off: the old address no longer redirects', (await head(FROM)).status === 404)
  check('R5 then deleted (confirmed)', (await signed({ op: 'delete', entity: 'redirects', id, confirm: true })).ok === true && sql(`select count(*) from public.redirects where id = '${id}'`) === '0')
  ids.length = 0
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  sql(`delete from public.redirects where from_path like '/cms-test-%${T}'`)
  if (pageId) { await signed({ op: 'trash', entity: 'pages', id: pageId }); await signed({ op: 'delete', entity: 'pages', id: pageId, confirm: true }) }
  check('Z cleanup: no test redirect or page left', sql(`select count(*) from public.redirects where from_path like '/cms-test-%${T}'`) === '0' && (await head(`/${PAGE_SLUG}`)).status === 404)
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed [LOCAL]`)
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
  await browser.close()
}
