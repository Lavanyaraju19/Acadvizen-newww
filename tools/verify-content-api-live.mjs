// Live check of the signed WordPress -> Main content API, on ONE disposable, labelled, noindex test
// page that is removed at the end. Run after the production redeploy that switches the API on:
//   node tools/verify-content-api-live.mjs
// The shared secret is read from the private credentials file (ACADVIZEN_CMS_WEBHOOK_SECRET in
// ~/.acadvizen-production.env) or from WORDPRESS_CMS_WEBHOOK_SECRET; it is never printed.
// Override the address with MAIN_URL (e.g. a local build). Real content and leads are not touched.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { signPayload } from '../lib/wordpress/signature.js'

const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const LEVEL = /localhost|127\.0\.0\.1/.test(MAIN) ? 'LOCAL' : 'PRODUCTION'

function readSecret() {
  if (process.env.WORDPRESS_CMS_WEBHOOK_SECRET) return process.env.WORDPRESS_CMS_WEBHOOK_SECRET
  const file = path.join(os.homedir(), '.acadvizen-production.env')
  if (!fs.existsSync(file)) return ''
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith('ACADVIZEN_CMS_WEBHOOK_SECRET='))
  if (!line) return ''
  // NAME='value' (anything after the closing quote, such as a comment, is ignored) or NAME=value.
  const raw = line.slice(line.indexOf('=') + 1)
  const quoted = raw.match(/^'([^']*)'/) || raw.match(/^"([^"]*)"/)
  return quoted ? quoted[1] : raw.trim().split(/\s+/)[0]
}
const SECRET = readSecret()

let pass = 0
let fail = 0
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} [${LEVEL}] ${name}${detail ? ` — ${detail}` : ''}`)
}

async function post(raw, { secret = SECRET, ts = Math.floor(Date.now() / 1000), signed = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (signed) Object.assign(headers, { 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, secret) })
  const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers, body: raw })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}
const body = (payload) => JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'live-verification' }, ...payload })
const api = (payload) => post(body(payload))
const page = async (slug) => {
  const r = await fetch(`${MAIN}/${slug}?t=${Date.now()}`, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } })
  return { status: r.status, html: r.status === 200 ? await r.text() : '' }
}
async function eventually(fn, tries = 10) {
  let last
  for (let i = 0; i < tries; i++) {
    last = await fn()
    if (last.ok) return last
    await new Promise((r) => setTimeout(r, 2000))
  }
  return last
}

const unsigned = await post(body({ op: 'list', entity: 'pages', limit: 1 }), { signed: false })
if (unsigned.status === 503) {
  console.log(`[${LEVEL}] The content API is still switched off (503 ${unsigned.body.error || ''}). Redeploy production after setting the variables, then run this again.`)
  process.exit(2)
}
if (SECRET.length < 32) {
  console.log('No shared secret found (ACADVIZEN_CMS_WEBHOOK_SECRET in ~/.acadvizen-production.env).')
  process.exit(2)
}

// 1. Security
check('unsigned request refused', unsigned.status === 401, `HTTP ${unsigned.status}`)
check('wrong secret refused', (await post(body({ op: 'list', entity: 'pages', limit: 1 }), { secret: 'x'.repeat(40) })).status === 401)
check('timestamp older than 5 minutes refused', (await post(body({ op: 'list', entity: 'pages', limit: 1 }), { ts: Math.floor(Date.now() / 1000) - 3600 })).status === 401)
const listed = await api({ op: 'list', entity: 'pages', limit: 1 })
check('correctly signed request accepted', listed.status === 200 && listed.body.ok === true, `HTTP ${listed.status} ${listed.body.error || ''}`)

// 2. Main-only publishing on a disposable page
const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const SLUG = `cms-production-test-${stamp}`
const TITLE = `CMS PRODUCTION TEST ${stamp}`
let id = ''
try {
  const created = await api({ op: 'save', entity: 'pages', record: { title: TITLE, slug: SLUG, description: `Live check ${stamp}`, noindex: true } })
  id = created.body?.data?.id || ''
  check('test page created as a draft', created.status === 200 && Boolean(id), `HTTP ${created.status} ${created.body.error || ''}`)
  check('a draft is not public', (await page(SLUG)).status === 404)
  const section = await api({ op: 'save', entity: 'sections', parent: 'pages', record: { page_id: id, type: 'text_block', order_index: 0, content_json: { heading: `Section ${stamp}`, text: `Section text ${stamp}` } } })
  check('a text section added', section.status === 200, `HTTP ${section.status} ${section.body.error || ''}`)
  const published = await api({ op: 'set_status', entity: 'pages', id, status: 'published' })
  check('test page published', published.status === 200, `HTTP ${published.status} ${published.body.error || ''}`)
  const live = await eventually(async () => { const p = await page(SLUG); return { ...p, ok: p.status === 200 && p.html.includes(TITLE) && p.html.includes(`Section text ${stamp}`) } })
  check('public page shows the title and the section', live.ok, `HTTP ${live.status}`)
  const robots = live.html.match(/<meta name="robots" content="([^"]+)"/)?.[1] || ''
  check('test page carries noindex', /noindex/.test(robots), robots)
  const sitemap = await (await fetch(`${MAIN}/sitemap.xml?t=${Date.now()}`)).text()
  check('noindex test page is not in the sitemap (needs release 9)', !sitemap.includes(SLUG))
  // Changes are claimed once by request id (reads are not): the same signed edit sent twice.
  const edit = body({ op: 'save', entity: 'pages', id, record: { description: `Edited live check ${stamp}` } })
  const first = await post(edit)
  const second = await post(edit)
  check('edit saved', first.status === 200, `HTTP ${first.status} ${first.body.error || ''}`)
  check('the same signed change sent again is refused (durable replay protection)', second.status === 409 && second.body.error === 'duplicate_request', `HTTP ${second.status} ${second.body.error || ''}`)
} catch (error) {
  // Never let an unexpected error look like a pass (the exit in finally would otherwise hide it).
  check('run finished without an unexpected error', false, String(error.message || error).split(/\r?\n/)[0].slice(0, 200))
} finally {
  if (id) {
    const trashed = await api({ op: 'trash', entity: 'pages', id })
    const removed = await api({ op: 'delete', entity: 'pages', id, confirm: true })
    check('test page removed (trash, then delete)', trashed.status === 200 && removed.status === 200, `HTTP ${trashed.status} / ${removed.status}`)
  }
  const gone = await eventually(async () => { const p = await page(SLUG); return { ...p, ok: p.status === 404 } })
  check('test address answers 404 after cleanup', gone.ok, `HTTP ${gone.status}`)
  const rows = []
  for (const trashed of [false, true]) {
    const left = await api({ op: 'list', entity: 'pages', search: SLUG, limit: 20, trashed })
    rows.push(...(left.body?.data || []).filter((r) => String(r.slug || '').startsWith(SLUG)))
  }
  check('no test rows left (live, draft or trash)', rows.length === 0, `${rows.length} rows`)
  console.log(`\n${pass} passed, ${fail} failed [${LEVEL}] | test address /${SLUG}`)
  process.exit(fail ? 1 : 0)
}
