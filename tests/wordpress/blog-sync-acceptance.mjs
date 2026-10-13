// LOCAL acceptance test: one blog on both websites, edited in any of the three editors.
//   Master Admin → Main Website → Blogs | the regular WordPress post editor (REST, as the block editor
//   saves) | Main's own /admin (simulated as it saves: a direct row update; the trigger bumps the version).
// Needs LOCAL_DB_CONTAINER and a local WordPress + Main. Never run against production.
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { signPayload } from '../../lib/wordpress/signature.js'

const { WP, MAIN, T, screen, get, launch, login, saveForm } = await import('./acceptanceKit.mjs')
if (/acadvizen\.com/.test(WP) || /acadvizen\.com/.test(MAIN)) { console.log('Refusing to run against a live site.'); process.exit(2) }
const DB = process.env.LOCAL_DB_CONTAINER
if (!DB) { console.log('LOCAL_DB_CONTAINER is required.'); process.exit(2) }

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
const sql = (query) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-tAc', query], { encoding: 'utf8', env: { ...process.env, MSYS_NO_PATHCONV: '1' } }).trim()
const q = (s) => `'${String(s).replace(/'/g, "''")}'`
const signed = async (body) => {
  const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'blog-sync-test' }, ...body })
  const ts = Math.floor(Date.now() / 1000)
  const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, process.env.WORDPRESS_CMS_WEBHOOK_SECRET) }, body: raw })
  return r.json().catch(() => ({}))
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const { browser } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
const nonce = (await (await admin.request.get(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)).text()).trim()
const rest = async (method, path, data) => {
  const r = await admin.request.fetch(`${WP}/wp-json/wp/v2${path}`, { method, headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }, data: data ? JSON.stringify(data) : undefined })
  return { status: r.status(), body: await r.json().catch(() => ({})) }
}
const copyOf = async (title) => {
  const found = await rest('GET', `/posts?search=${encodeURIComponent(title)}&status=any&context=edit&per_page=5`)
  return Array.isArray(found.body) ? found.body.find((p) => p.title?.raw === title) : null
}
const pullNow = async () => {
  await admin.goto(screen('blogs'))
  const href = await admin.locator('a[href*="action=acv_cms_blog_pull"]').first().getAttribute('href')
  await admin.goto(new URL(href, `${WP}/wp-admin/`).href)
}
const syncState = async (postId) => {
  await admin.goto(`${WP}/wp-admin/edit.php?post_type=post&s=${encodeURIComponent('CMS TEST sync')}&post_status=all`)
  return (await admin.locator(`#post-${postId} td.column-acv_main`).innerText().catch(() => '')).trim()
}
const mainIds = []
const wpIds = []
const SLUG = `cms-test-sync-${T}`
const TITLE = `CMS TEST sync ${T}`

try {
  // S1. Created in Master Admin → Main Website → Blogs, Publish To: Both.
  await admin.goto(screen('blogs', '&view=edit'))
  await admin.fill('[name="acv_field[title]"]', TITLE)
  await admin.fill('[name="acv_field[slug]"]', SLUG)
  await admin.locator('#acv-blocks .acv-add-row button', { hasText: 'Paragraph' }).click()
  await admin.locator('#acv-blocks .acv-card').nth(0).getByLabel('Text').fill(`First version ${T}`)
  await admin.selectOption('[name="acv_target"]', 'both')
  await admin.selectOption('#acv-status', 'published')
  await saveForm(admin)
  const mainId = new URL(admin.url()).searchParams.get('id')
  if (mainId) mainIds.push(mainId)
  let copy = await copyOf(TITLE)
  if (copy) wpIds.push(copy.id)
  check('S1 Both: one save creates the Main blog and the Enrollment post', Boolean(mainId && copy && copy.status === 'publish') && (await get(`/blog/${SLUG}`)).status === 200, `main=${mainId} copy=${copy?.id}/${copy?.status}`)
  check('S1 the Enrollment post is marked in step with Main', /In step/.test(await syncState(copy.id)))

  // S2. Edited in Main's own /admin: the Enrollment copy follows.
  sql(`update public.blogs set title = ${q(`${TITLE} (edited in Main admin)`)}, content_json = ${q(JSON.stringify({ blocks: [{ block_type: 'paragraph', content_json: { text: `Main admin text ${T}` }, order_index: 0 }] }))}::jsonb where id = ${q(mainId)}`)
  await pullNow()
  copy = await copyOf(`${TITLE} (edited in Main admin)`)
  check('S2 an edit in Main\'s /admin reaches the Enrollment post (title and article)', Boolean(copy) && copy.content.raw.includes(`Main admin text ${T}`), copy ? copy.title.raw : 'copy not found under the new title')
  const titleNow = `${TITLE} (edited in Main admin)`

  // S3. Edited in the regular WordPress post editor (REST save, as the block editor does): Main follows.
  const edited = copy.content.raw.replace(`Main admin text ${T}`, `Edited in WordPress with <strong>bold</strong> ${T}`)
  const saved = await rest('POST', `/posts/${copy.id}`, { title: `${TITLE} (edited in WordPress)`, content: edited })
  await sleep(500)
  const mainRow = await signed({ op: 'get', entity: 'blogs', id: mainId })
  const blocksText = JSON.stringify(mainRow?.data?.content_json || {})
  check('S3 an edit in the WordPress post editor reaches Main (title, article, bold kept)', saved.status === 200 && mainRow?.data?.title === `${TITLE} (edited in WordPress)` && blocksText.includes('<strong>bold</strong>'), `${saved.status} ${mainRow?.data?.title}`)
  check('S3 the Main cover image did not become an extra content block', !blocksText.includes('"block_type":"image"'))
  const pub = await get(`/blog/${SLUG}`)
  check('S3 the public Main blog shows the WordPress edit', pub.status === 200 && pub.html.includes(`Edited in WordPress with`))
  check('S3 the post is marked in step', /In step/.test(await syncState(copy.id)))

  // S4. Conflict: changed on Main and in WordPress before they were aligned again. Nothing is overwritten.
  sql(`update public.blogs set title = ${q(`${TITLE} (Main side of conflict)`)} where id = ${q(mainId)}`)
  const conflict = await rest('POST', `/posts/${copy.id}`, { title: `${TITLE} (WordPress side of conflict)` })
  await sleep(500)
  check('S4 a WordPress edit on a stale version is not sent: Main keeps its own change', conflict.status === 200 && sql(`select title from public.blogs where id = ${q(mainId)}`) === `${TITLE} (Main side of conflict)`)
  check('S4 the post shows the conflict', /Conflict/.test(await syncState(copy.id)))
  await pullNow()
  copy = await copyOf(`${TITLE} (WordPress side of conflict)`)
  check('S4 the next comparison does not overwrite the WordPress side either', Boolean(copy))
  // Resolution: open in Main Website → Blogs and save the version to keep (here Main's).
  await admin.goto(screen('blogs', `&view=edit&id=${mainId}`))
  await saveForm(admin)
  copy = await copyOf(`${TITLE} (Main side of conflict)`)
  check('S4 saving in Main Website → Blogs resolves it: both websites have that version', Boolean(copy) && /In step/.test(await syncState(copy.id)))

  // S5. Trashing the Enrollment post affects Enrollment only.
  await rest('DELETE', `/posts/${copy.id}`)
  check('S5 trashing the Enrollment post leaves the Main blog live', (await get(`/blog/${SLUG}`)).status === 200)
  await rest('POST', `/posts/${copy.id}`, { status: 'publish' })

  // S6. Removed in Main's /admin (moved to its trash): the Enrollment post goes to Draft, not deleted.
  sql(`update public.blogs set deleted_at = now(), status = 'draft' where id = ${q(mainId)}`)
  await pullNow()
  const after = await rest('GET', `/posts/${copy.id}?context=edit`)
  check('S6 removed on Main: the Enrollment post is set to Draft and kept', after.status === 200 && after.body.status === 'draft', after.body.status)

  // S7. Created in the regular WordPress post editor with "Also publish on the Main Website".
  const slug7 = `cms-test-sync-new-${T}`
  const created = await rest('POST', '/posts', { title: `CMS TEST sync from editor ${T}`, slug: slug7, status: 'publish', content: `<!-- wp:paragraph --><p>Written in the WordPress editor ${T}</p><!-- /wp:paragraph -->`, meta: { acv_also_main: true } })
  if (created.body?.id) wpIds.push(created.body.id)
  await sleep(500)
  const row7 = sql(`select id || '|' || status from public.blogs where slug = ${q(slug7)}`)
  if (row7) mainIds.push(row7.split('|')[0])
  const page7 = await get(`/blog/${slug7}`)
  check('S7 a new WordPress post with "Also publish on the Main Website" is published on Main too', created.status === 201 && row7.endsWith('|published') && page7.status === 200 && page7.html.includes(`Written in the WordPress editor ${T}`), `${created.status} ${row7}`)
  check('S7 that post is now linked and in step', /In step/.test(await syncState(created.body.id)))

  // S8. A Contributor cannot use the option (cannot publish on Main).
  const contributor = await login(browser, process.env.WP_CONTRIBUTOR_USER, process.env.WP_CONTRIBUTOR_PASS)
  const cNonce = (await (await contributor.request.get(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`)).text()).trim()
  const cr = await contributor.request.fetch(`${WP}/wp-json/wp/v2/posts`, { method: 'POST', headers: { 'X-WP-Nonce': cNonce, 'Content-Type': 'application/json' }, data: JSON.stringify({ title: `CMS TEST sync contributor ${T}`, status: 'pending', meta: { acv_also_main: true } }) })
  const crBody = await cr.json().catch(() => ({}))
  if (crBody?.id) wpIds.push(crBody.id)
  check('S8 a Contributor cannot ask for Main publishing (refused)', cr.status() === 403 || crBody?.meta?.acv_also_main !== true, String(cr.status()))
  check('S8 nothing was created on Main for the Contributor', sql(`select count(*) from public.blogs where title = ${q(`CMS TEST sync contributor ${T}`)}`) === '0')
} catch (error) {
  check('run finished without an unexpected error', false, error.message.split('\n')[0])
} finally {
  for (const id of mainIds) { sql(`update public.blogs set deleted_at = coalesce(deleted_at, now()), status = 'draft' where id = ${q(id)}`); await signed({ op: 'delete', entity: 'blogs', id, confirm: true }) }
  for (const id of wpIds) await rest('DELETE', `/posts/${id}?force=true`)
  // WordPress creates a post before it refuses a field (the Contributor case): find any by title too.
  const stray = (await rest('GET', `/posts?search=${encodeURIComponent(T)}&status=any&per_page=50`)).body
  for (const post of Array.isArray(stray) ? stray : []) if (String(post.title?.rendered || '').includes('CMS TEST sync')) await rest('DELETE', `/posts/${post.id}?force=true`)
  const leftMain = sql(`select count(*) from public.blogs where slug like ${q(`cms-test-sync%${T}`)} or title like ${q(`CMS TEST sync%${T}%`)}`)
  const leftWp = (await rest('GET', `/posts?search=${encodeURIComponent('CMS TEST sync')}&status=any&per_page=50`)).body
  check('Z cleanup: no test blog left on either website', leftMain === '0' && Array.isArray(leftWp) && leftWp.filter((p) => String(p.title?.rendered || '').includes(T)).length === 0, `main=${leftMain}`)
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${results.filter((r) => !r.ok).length} failed [LOCAL]`)
  process.exitCode = results.some((r) => !r.ok) ? 1 : 0
  await browser.close()
}
