// LOCAL acceptance test: edits from two editors on the same Main record (edit conflicts).
// Another editor is simulated exactly as Main's /admin saves: a direct update of the row in the local
// Main database (its set_updated_at trigger bumps the version). Never run against production.
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { signPayload } from '../../lib/wordpress/signature.js'

const { WP, MAIN, T, screen, get, launch, login, saveForm } = await import('./acceptanceKit.mjs')
if (/acadvizen\.com/.test(WP) || /acadvizen\.com/.test(MAIN)) { console.log('Refusing to run against a live site.'); process.exit(2) }
const DB = process.env.LOCAL_DB_CONTAINER
if (!DB) { console.log('LOCAL_DB_CONTAINER (the local Supabase database container) is required.'); process.exit(2) }

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const sql = (query) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-tAc', query], { encoding: 'utf8', env: { ...process.env, MSYS_NO_PATHCONV: '1' } }).trim()
const signed = async (body) => {
  const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'conflict-test' }, ...body })
  const ts = Math.floor(Date.now() / 1000)
  const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, process.env.WORDPRESS_CMS_WEBHOOK_SECRET) }, body: raw })
  return r.json().catch(() => ({}))
}
const flash = (page) => page.evaluate(() => {
  const box = document.querySelector('.acv-cms-flash')
  return box ? { kind: (box.className.match(/notice-(success|warning|error)/) || [])[1] || 'none', text: (box.textContent || '').replace(/\s+/g, ' ').trim() } : { kind: 'none', text: '' }
})

const SLUG = `cms-test-conflict-${T}`
const created = await signed({ op: 'save', entity: 'pages', record: { title: `CMS TEST conflict ${T}`, slug: SLUG, description: 'Original description', noindex: true } })
const id = created?.data?.id
const { browser } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)

try {
  check('setup: a test page exists on Main', Boolean(id), JSON.stringify(created).slice(0, 120))
  // 1. WordPress opens the page.
  await admin.goto(screen('pages', `&view=edit&id=${id}`))
  const opened = await admin.inputValue('[name="acv_expected_updated_at"]').catch(() => '')
  check('the edit form carries the version it opened', opened !== '')
  // 2. Meanwhile, the same page is changed in Main's own admin (direct row update, trigger bumps the version).
  sql(`update public.pages set description = 'Changed in Main admin' where id = '${id}'`)
  const bumped = sql(`select updated_at from public.pages where id = '${id}'`)
  check('the other editor\'s save changed the version', bumped && Date.parse(bumped) !== Date.parse(opened), `${opened} -> ${bumped}`)
  // 3. WordPress saves its (stale) form.
  await admin.fill('[name="acv_field[description]"]', 'Changed in WordPress')
  await saveForm(admin)
  const f1 = await flash(admin)
  check('C-1 the stale save is refused with a red message explaining what happened', f1.kind === 'error' && /changed this on the Main Website/.test(f1.text), `${f1.kind}: ${f1.text.slice(0, 120)}`)
  check('C-2 the other editor\'s change is kept on Main', sql(`select description from public.pages where id = '${id}'`) === 'Changed in Main admin')
  check('C-3 what was typed in WordPress is kept in the form', (await admin.inputValue('[name="acv_field[description]"]').catch(() => '')) === 'Changed in WordPress')
  // 4. Saving again after the warning is an informed decision and goes through.
  await saveForm(admin)
  const f2 = await flash(admin)
  check('C-4 saving again (informed) replaces the other change', f2.kind === 'success' && sql(`select description from public.pages where id = '${id}'`) === 'Changed in WordPress', `${f2.kind}: ${f2.text.slice(0, 80)}`)
  // 5. A normal edit with no other editor involved is unaffected.
  await admin.goto(screen('pages', `&view=edit&id=${id}`))
  await admin.fill('[name="acv_field[description]"]', 'Second WordPress edit')
  await saveForm(admin)
  const f3 = await flash(admin)
  check('C-5 an edit with no conflict saves normally', f3.kind === 'success' && sql(`select description from public.pages where id = '${id}'`) === 'Second WordPress edit', f3.kind)
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  if (id) for (const op of ['trash', 'delete']) await signed({ op, entity: 'pages', id, confirm: true })
  check('Z cleanup: the test page is gone', (await get(`/${SLUG}`)).status === 404 && sql(`select count(*) from public.pages where slug = '${SLUG}'`) === '0')
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed [LOCAL]`)
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
  await browser.close()
}
