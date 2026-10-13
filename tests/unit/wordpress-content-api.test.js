import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { handleContentRequest, blogPlainText, createRequestClaimer } from '../../lib/wordpress/contentApi.js'
import { HOME_LISTS } from '../../lib/homepageDefaults.js'
import { sanitizeRichHtml } from '../../lib/wordpress/richHtml.js'
import { signPreview, verifyPreview } from '../../lib/wordpress/previewToken.js'
import { signPayload } from '../../lib/wordpress/signature.js'
import { createEventDeduper } from '../../lib/wordpress/webhook.js'

const SECRET = 'unit-test-secret-0123456789abcdef0123456789'
const config = { enabled: true, secret: SECRET }

/** In-memory stand-in for the Supabase query builder (only what contentApi uses). */
function fakeDb(seed = {}) {
  const tables = Object.fromEntries(Object.entries(seed).map(([t, rows]) => [t, rows.map((r) => ({ ...r }))]))
  const from = (table) => {
    tables[table] = tables[table] || []
    const filters = []
    let mode = 'select'
    let values = null
    let head = false
    let count = false
    let range = null
    const orders = []
    const matches = (row) => filters.every((f) => f(row))
    const api = {
      select(_cols, opts = {}) { if (mode === 'select') { head = Boolean(opts.head); count = opts.count === 'exact' } return api },
      eq(c, v) { filters.push((r) => r[c] === v); return api },
      neq(c, v) { filters.push((r) => r[c] !== v); return api },
      in(c, vs) { filters.push((r) => vs.includes(r[c])); return api },
      like(c, pattern) { const parts = pattern.split('%'); filters.push((r) => { const v = String(r[c] ?? ''); let at = 0; return parts.every((p, i) => { const hit = i === 0 ? (v.startsWith(p) ? 0 : -1) : v.indexOf(p, at); if (hit < 0) return false; at = hit + p.length; return i < parts.length - 1 || p === '' || v.endsWith(p) }) }); return api },
      is(c, v) { filters.push((r) => (r[c] ?? null) === v); return api },
      not(c, _op, v) { filters.push((r) => (r[c] ?? null) !== v); return api },
      or() { return api },
      order(c, o = {}) { orders.push([c, o.ascending !== false]); return api },
      limit() { return api },
      range(a, b) { range = [a, b]; return api },
      insert(row) { mode = 'insert'; values = row; return api },
      update(row) { mode = 'update'; values = row; return api },
      delete() { mode = 'delete'; return api },
      async maybeSingle() { const { data } = await api.run(); return { data: data?.[0] || null, error: null } },
      async single() { const { data } = await api.run(); return data?.[0] ? { data: data[0], error: null } : { data: null, error: { message: 'no row' } } },
      then(resolve, reject) { return api.run().then(resolve, reject) },
      async run() {
        const rows = tables[table]
        if (mode === 'insert') { const made = (Array.isArray(values) ? values : [values]).map((v) => ({ id: randomUUID(), created_at: new Date().toISOString(), ...v })); rows.push(...made); return { data: made, error: null } }
        if (mode === 'update') { const hit = rows.filter(matches); hit.forEach((r) => Object.assign(r, values)); return { data: hit, error: null } }
        if (mode === 'delete') { tables[table] = rows.filter((r) => !matches(r)); return { data: [], error: null } }
        let hit = rows.filter(matches)
        for (const [c, asc] of [...orders].reverse()) hit = [...hit].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1))
        const total = hit.length
        if (range) hit = hit.slice(range[0], range[1] + 1)
        return { data: head ? null : hit, error: null, count: count ? total : null }
      },
    }
    return api
  }
  return { from, tables }
}

let clock = Date.parse('2026-10-10T12:00:00Z')
// Stand-ins for lib/pageDrafts.js (its real behaviour is covered by the local end-to-end run).
const fakePageDeps = (db, broken = []) => ({
  publishPage: async (id) => {
    if (broken.length) return { ok: false, status: 409, error: 'broken', broken }
    const row = db.tables.pages.find((r) => r.id === id)
    Object.assign(row, { status: 'published', published_at: row.published_at || new Date(clock).toISOString(), is_published: true })
    return { ok: true, live: row }
  },
  startPageDraft: async (id) => {
    const live = db.tables.pages.find((r) => r.id === id)
    const draft = { ...live, id: randomUUID(), draft_of_id: id, status: 'draft', published_at: null }
    db.tables.pages.push(draft)
    return { ok: true, draft }
  },
})

function call(body, { db, secret = SECRET, ts, cfg = config, deduper = createEventDeduper(), raw, broken } = {}) {
  const rawBody = raw ?? JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'tester' }, ...body })
  const timestamp = ts ?? Math.floor(clock / 1000)
  const revalidated = []
  const audited = []
  return handleContentRequest({
    rawBody,
    headers: { 'x-acadvizen-timestamp': String(timestamp), 'x-acadvizen-signature': signPayload(rawBody, timestamp, secret) },
    config: cfg,
    deps: { db, deduper, ...fakePageDeps(db, broken), revalidate: async (type, o) => { revalidated.push([type, o.slug]); return { ok: true } }, audit: async (e) => audited.push(e) },
    now: clock,
  }).then((r) => ({ ...r, revalidated, audited }))
}

/** Like call(), but the test chooses the replay protection (durable claimRequest and/or deduper). */
function callWith(body, { db, claimRequest, deduper, log } = {}) {
  const rawBody = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'tester' }, ...body })
  const timestamp = Math.floor(clock / 1000)
  return handleContentRequest({
    rawBody,
    headers: { 'x-acadvizen-timestamp': String(timestamp), 'x-acadvizen-signature': signPayload(rawBody, timestamp, SECRET) },
    config,
    deps: { db, claimRequest, deduper, log, ...fakePageDeps(db), revalidate: async () => ({ ok: true }), audit: async () => {} },
    now: clock,
  })
}

test('refuses requests that are not correctly signed, current and meant for this endpoint', async () => {
  const db = fakeDb()
  assert.equal((await call({ op: 'list', entity: 'blogs' }, { db, cfg: { ...config, enabled: false } })).status, 503)
  assert.equal((await call({ op: 'list', entity: 'blogs' }, { db, cfg: { enabled: true, secret: 'short' } })).status, 503)
  assert.equal((await call({ op: 'list', entity: 'blogs' }, { db, secret: 'another-secret-0123456789abcdef0123456789' })).status, 401)
  assert.equal((await call({ op: 'list', entity: 'blogs' }, { db, ts: Math.floor(clock / 1000) - 3600 })).status, 401)
  const webhookBody = JSON.stringify({ event_id: 'x', content_type: 'blog', action: 'upsert', slug: 'a' })
  assert.equal((await call({}, { db, raw: webhookBody })).body.error, 'wrong_purpose')
  assert.equal((await call({ op: 'list', entity: 'blogs', request_id: 'nope' }, { db })).status, 400)
  assert.equal((await call({ op: 'list', entity: 'users' }, { db })).body.error, 'unsupported_entity')
})

test('a retried mutation with the same request id is not applied twice', async () => {
  const db = fakeDb()
  const deduper = createEventDeduper()
  const request_id = randomUUID()
  const first = await call({ request_id, op: 'save', entity: 'tools_extended', record: { name: 'Tool', slug: 'tool-a' } }, { db, deduper })
  const second = await call({ request_id, op: 'save', entity: 'tools_extended', record: { name: 'Tool', slug: 'tool-a' } }, { db, deduper })
  assert.equal(first.status, 200)
  assert.equal(second.status, 409)
  assert.equal(db.tables.tools_extended.length, 1)
})

test('pages: validated, created as drafts, published and unpublished through the workflow', async () => {
  const db = fakeDb({ pages: [{ id: randomUUID(), title: 'Existing', slug: 'taken', status: 'published' }] })
  assert.equal((await call({ op: 'save', entity: 'pages', record: { slug: 'x' } }, { db })).status, 400, 'title required')
  assert.equal((await call({ op: 'save', entity: 'pages', record: { title: 'T', slug: 'Bad Slug' } }, { db })).status, 400)
  assert.equal((await call({ op: 'save', entity: 'pages', record: { title: 'T', slug: 'taken' } }, { db })).body.error, 'slug_taken')
  const notEditable = await call({ op: 'save', entity: 'pages', record: { title: 'T', slug: 'ok', status: 'published', content: { html: 'x' } } }, { db })
  assert.deepEqual(notEditable.body.details, ['status: not editable here', 'content: not editable here'])
  const created = await call({ op: 'save', entity: 'pages', record: { title: 'Test page', slug: 'cms-test', noindex: true } }, { db })
  assert.equal(created.status, 200)
  const row = db.tables.pages.find((r) => r.slug === 'cms-test')
  assert.equal(row.status, 'draft')
  assert.equal(row.is_active, true)
  assert.equal(row.is_published, false)
  const published = await call({ op: 'set_status', entity: 'pages', id: row.id, status: 'published' }, { db })
  assert.equal(published.body.data.status, 'published')
  assert.ok(row.published_at)
  assert.equal(row.is_published, true)
  assert.deepEqual(published.revalidated, [['page', 'cms-test']])
  await call({ op: 'set_status', entity: 'pages', id: row.id, status: 'review' }, { db })
  assert.equal(row.status, 'review')
  assert.equal(row.is_published, false)
  assert.equal((await call({ op: 'set_status', entity: 'pages', id: row.id, status: 'live!' }, { db })).status, 400)
  const blocked = await call({ op: 'set_status', entity: 'pages', id: row.id, status: 'published' }, { db, broken: [{ href: '/missing' }] })
  assert.equal(blocked.status, 409)
  assert.equal(blocked.body.error, 'broken_links')
  assert.equal(row.status, 'review', 'a blocked publish changes nothing')
})

test('pages: a live page is changed through a private draft copy that the list never shows', async () => {
  const liveId = randomUUID()
  const db = fakeDb({ pages: [{ id: liveId, title: 'Live', slug: 'live', status: 'published', draft_of_id: null, deleted_at: null }] })
  const started = await call({ op: 'start_draft', entity: 'pages', id: liveId }, { db })
  assert.equal(started.status, 200)
  assert.equal(started.body.data.draft_of_id, liveId)
  assert.equal(started.body.data.status, 'draft')
  const got = await call({ op: 'get', entity: 'pages', id: liveId }, { db })
  assert.equal(got.body.data.draft_id, started.body.data.id)
  // The draft keeps the live page's address: saving either one is not a clash, but a third page is.
  assert.equal((await call({ op: 'save', entity: 'pages', id: started.body.data.id, record: { title: 'Live v2', slug: 'live' } }, { db })).status, 200)
  assert.equal((await call({ op: 'save', entity: 'pages', id: liveId, record: { title: 'Live', slug: 'live' } }, { db })).status, 200)
  assert.equal((await call({ op: 'save', entity: 'pages', record: { title: 'Other', slug: 'live' } }, { db })).body.error, 'slug_taken')
  assert.equal((await call({ op: 'start_draft', entity: 'blogs', id: liveId }, { db })).body.error, 'not_supported')
})

test('trash, restore and permanent delete need the right order and a confirmation', async () => {
  const db = fakeDb()
  await call({ op: 'save', entity: 'blogs', record: { title: 'B', slug: 'b-1' } }, { db })
  const id = db.tables.blogs[0].id
  assert.equal((await call({ op: 'delete', entity: 'blogs', id }, { db })).body.error, 'confirmation_required')
  assert.equal((await call({ op: 'delete', entity: 'blogs', id, confirm: true }, { db })).body.error, 'not_in_trash')
  await call({ op: 'trash', entity: 'blogs', id }, { db })
  assert.ok(db.tables.blogs[0].deleted_at)
  assert.equal((await call({ op: 'set_status', entity: 'blogs', id, status: 'published' }, { db })).body.error, 'in_trash')
  await call({ op: 'restore', entity: 'blogs', id }, { db })
  assert.equal(db.tables.blogs[0].deleted_at, null)
  assert.equal(db.tables.blogs[0].status, 'draft')
  await call({ op: 'trash', entity: 'blogs', id }, { db })
  assert.equal((await call({ op: 'delete', entity: 'blogs', id, confirm: true }, { db })).status, 200)
  assert.equal(db.tables.blogs.length, 0)
})

test('blogs: only the four block types, sanitised, with the plain text kept in step', async () => {
  const db = fakeDb()
  const record = {
    title: 'Blog', slug: 'blog-1',
    content_json: { blocks: [
      { block_type: 'heading', content_json: { text: 'Intro', level: 2 } },
      { block_type: 'paragraph', content_json: { text: 'Hello <script>alert(1)</script><a href="javascript:alert(1)" onclick="x()">link</a> <strong>bold</strong>' } },
      { block_type: 'list', content_json: { items: ['One', 'Two'] } },
      { block_type: 'image', content_json: { src: 'https://enroll.acadvizen.com/wp-content/uploads/a.png', alt: 'A', caption: '' } },
    ] },
  }
  assert.equal((await call({ op: 'save', entity: 'blogs', record }, { db })).status, 200)
  const saved = db.tables.blogs[0]
  assert.equal(saved.content_json.blocks[1].content_json.text, 'Hello <a>link</a> <strong>bold</strong>')
  assert.equal(saved.content, 'Intro\n\nHello link bold\n\nOne\nTwo')
  const bad = (blocks) => call({ op: 'save', entity: 'blogs', record: { title: 'X', slug: `x-${randomUUID().slice(0, 8)}`, content_json: { blocks } } }, { db })
  assert.equal((await bad([{ block_type: 'html', content_json: { html: '<b>x</b>' } }])).status, 400)
  assert.equal((await bad([{ block_type: 'image', content_json: { src: 'javascript:alert(1)' } }])).status, 400)
  assert.equal((await bad([{ block_type: 'heading', content_json: { text: 'H', level: 1 } }])).status, 400)
  assert.equal(blogPlainText(null), '')
})

test('active-flag types (tools): publishing sets is_active and its public mirror', async () => {
  const db = fakeDb()
  await call({ op: 'save', entity: 'tools_extended', record: { name: 'Canva test', slug: 'canva-test', brand_color: '#00C4CC', website_url: 'https://www.canva.com' } }, { db })
  const tool = db.tables.tools_extended[0]
  assert.equal(tool.is_active, false)
  await call({ op: 'set_status', entity: 'tools_extended', id: tool.id, active: true }, { db })
  assert.equal(tool.is_active, true)
  assert.equal(tool.published, true)
  assert.equal((await call({ op: 'save', entity: 'tools_extended', record: { name: 'X', slug: 'x', brand_color: 'red; background:url(x)' } }, { db })).status, 400)
  assert.equal((await call({ op: 'save', entity: 'tools_extended', record: { name: 'X', slug: 'x2', website_url: 'http://insecure.example' } }, { db })).status, 400)
})

test('sections: Main section types only; rich text sanitised; style limited to known keys; reorder', async () => {
  const pageId = randomUUID()
  const db = fakeDb({ pages: [{ id: pageId, title: 'P', slug: 'p' }], sections: [] })
  assert.equal((await call({ op: 'save', entity: 'sections', record: { page_id: pageId, type: 'raw_html' } }, { db })).body.error, 'unsupported_section_type')
  assert.equal((await call({ op: 'save', entity: 'sections', record: { page_id: pageId, type: 'hero', style_json: { onclick: 'x' } } }, { db })).body.error, 'invalid_section')
  const a = await call({ op: 'save', entity: 'sections', record: { page_id: pageId, type: 'custom_rich_text', order_index: 0, content_json: { heading: 'H', text: '<p>ok</p><img src=x onerror=alert(1)>' }, style_json: { alignment: 'center', background_color: '#112233' } } }, { db })
  assert.equal(a.status, 200)
  assert.equal(db.tables.sections[0].content_json.text, '<p>ok</p>')
  const b = await call({ op: 'save', entity: 'sections', record: { page_id: pageId, type: 'faq', order_index: 1, content_json: { heading: 'FAQ', items: [{ question: 'Q', answer: 'A' }] } } }, { db })
  await call({ op: 'reorder_sections', entity: 'sections', page_id: pageId, ids: [b.body.data.id, a.body.data.id] }, { db })
  assert.equal(db.tables.sections.find((s) => s.type === 'faq').order_index, 0)
  assert.equal((await call({ op: 'save', entity: 'sections', record: { page_id: pageId, type: 'hero', content_json: [], style_json: [] } }, { db })).status, 200, 'PHP sends an empty object as []')
  assert.equal((await call({ op: 'save', entity: 'sections', record: { page_id: pageId, type: 'hero', style_json: ['x'] } }, { db })).body.error, 'invalid_section')
  assert.equal((await call({ op: 'save', entity: 'sections', record: { page_id: randomUUID(), type: 'hero' } }, { db })).body.error, 'page_not_found')
})

test('rich text keeps formatting and safe links only', () => {
  assert.equal(sanitizeRichHtml('<p onclick="x">Hi <em>there</em></p>'), '<p>Hi <em>there</em></p>')
  assert.equal(sanitizeRichHtml('<a href="https://acadvizen.com/x">a</a>'), '<a href="https://acadvizen.com/x" rel="noopener noreferrer">a</a>')
  assert.equal(sanitizeRichHtml('<a href="/courses">a</a>'), '<a href="/courses">a</a>')
  assert.equal(sanitizeRichHtml('<a href="jav&#x09;ascript:alert(1)">a</a>'), '<a>a</a>')
  assert.equal(sanitizeRichHtml('<style>p{}</style><iframe src=x></iframe><svg><script>1</script></svg>ok'), 'ok')
  assert.equal(sanitizeRichHtml('1 < 2 <b>x</b>'), '1 &lt; 2 <b>x</b>')
  assert.equal(sanitizeRichHtml('x'.repeat(60000)), null)
})

test('preview links: valid only for their record, unexpired, at most an hour ahead', () => {
  const id = randomUUID()
  const now = Date.parse('2026-10-10T12:00:00Z')
  const exp = Math.floor(now / 1000) + 600
  const sig = signPreview({ entity: 'pages', id, exp }, SECRET)
  assert.deepEqual(verifyPreview({ entity: 'pages', id, exp, sig }, SECRET, now), { ok: true })
  assert.equal(verifyPreview({ entity: 'blogs', id, exp, sig }, SECRET, now).ok, false)
  assert.equal(verifyPreview({ entity: 'pages', id: randomUUID(), exp, sig }, SECRET, now).ok, false)
  assert.equal(verifyPreview({ entity: 'pages', id, exp, sig }, SECRET, now + 601000).reason, 'expired')
  const far = Math.floor(now / 1000) + 7200
  assert.equal(verifyPreview({ entity: 'pages', id, exp: far, sig: signPreview({ entity: 'pages', id, exp: far }, SECRET) }, SECRET, now).reason, 'expired')
  assert.equal(verifyPreview({ entity: 'tools_extended', id, exp, sig }, SECRET, now).reason, 'unsupported_entity')
  assert.equal(verifyPreview({ entity: 'pages', id, exp, sig }, 'short', now).reason, 'not_configured')
})

// A shared request-id store, as the wordpress_content_requests table behaves (primary key).
function fakeRequestStore({ fail = false } = {}) {
  const ids = new Map()
  const pruned = []
  return {
    ids,
    pruned,
    from(table) {
      assert.equal(table, 'wordpress_content_requests')
      return {
        insert: async (row) => {
          if (fail) return { error: { code: '42P01', message: 'relation does not exist' } }
          if (ids.has(row.request_id)) return { error: { code: '23505', message: 'duplicate key' } }
          ids.set(row.request_id, row)
          return { error: null }
        },
        delete: () => ({ lt: async (column, value) => { pruned.push([column, value]); return { error: null } } }),
      }
    },
  }
}

test('replay protection is shared by every server instance (durable store, not process memory)', async () => {
  const db = fakeDb()
  const store = fakeRequestStore()
  // Two independent "instances": no shared memory, only the shared store.
  const instanceA = createRequestClaimer(store, { pruneChance: 0 })
  const instanceB = createRequestClaimer(store, { pruneChance: 0 })
  const request_id = randomUUID()
  const body = { request_id, op: 'save', entity: 'tools_extended', record: { name: 'Tool', slug: 'tool-shared' } }
  const first = await callWith(body, { db, claimRequest: instanceA })
  const replay = await callWith(body, { db, claimRequest: instanceB })
  assert.equal(first.status, 200)
  assert.equal(replay.status, 409)
  assert.equal(replay.body.error, 'duplicate_request')
  assert.equal(db.tables.tools_extended.length, 1, 'the change is applied once')
  assert.deepEqual(store.ids.get(request_id), { request_id, op: 'save', entity: 'tools_extended' })
  // Reads do not use up request ids.
  const listed = await callWith({ request_id: randomUUID(), op: 'list', entity: 'tools_extended' }, { db, claimRequest: instanceA })
  assert.equal(listed.status, 200)
  assert.equal(store.ids.size, 1)
})

test('if the replay store is unavailable, changes are refused rather than accepted unprotected', async () => {
  const db = fakeDb()
  const claimRequest = createRequestClaimer(fakeRequestStore({ fail: true }), { pruneChance: 0 })
  const r = await callWith({ request_id: randomUUID(), op: 'save', entity: 'tools_extended', record: { name: 'Tool', slug: 'tool-x' } }, { db, claimRequest })
  assert.equal(r.status, 503)
  assert.equal(r.body.error, 'replay_protection_unavailable')
  assert.equal((db.tables.tools_extended || []).length, 0)
  const thrower = createRequestClaimer({ from: () => ({ insert: async () => { throw new Error('network') } }) })
  assert.equal(await thrower(randomUUID()), 'unavailable')
  // No store and no in-memory fallback configured: refused too.
  const none = await callWith({ request_id: randomUUID(), op: 'trash', entity: 'tools_extended', id: randomUUID() }, { db, claimRequest: null, deduper: null })
  assert.equal(none.status, 503)
})

test('old request ids are pruned now and then, well outside the 5-minute signature window', async () => {
  const store = fakeRequestStore()
  const claim = createRequestClaimer(store, { pruneChance: 1, retentionMs: 86400000, clock: () => Date.parse('2026-10-11T12:00:00Z') })
  assert.equal(await claim(randomUUID(), { op: 'save', entity: 'blogs' }), 'claimed')
  assert.deepEqual(store.pruned, [['received_at', '2026-10-10T12:00:00.000Z']])
})

/* Site chrome: settings rows and menus ---------------------------------------------------------- */
test('settings rows (site, header, footer): only drawn fields are editable; never created, deleted or hidden', async () => {
  const headerId = randomUUID()
  const db = fakeDb({
    site_settings: [{ id: 'default', company_name: 'Acadvizen', ui_copy: {}, design_tokens: { primary: '#000' } }],
    header_settings: [{ id: headerId, announcement_text: 'Old', nav_items: [{ label: 'Home' }] }],
    footer_settings: [{ id: randomUUID(), copyright_text: '© {year}' }],
  })
  // Text id of site_settings.
  assert.equal((await call({ op: 'get', entity: 'site_settings', id: 'default' }, { db })).body.data.company_name, 'Acadvizen')
  const saved = await call({ op: 'save', entity: 'site_settings', id: 'default', record: { company_name: 'Acadvizen Academy', ui_copy: [] } }, { db })
  assert.equal(saved.status, 200)
  assert.deepEqual(db.tables.site_settings[0].ui_copy, {}, 'PHP [] arrives as an empty object')
  assert.deepEqual(db.tables.site_settings[0].design_tokens, { primary: '#000' }, 'fields not offered are kept')
  // Fields the site never draws are refused.
  assert.equal((await call({ op: 'save', entity: 'site_settings', id: 'default', record: { design_tokens: {} } }, { db })).body.error, 'validation_failed')
  assert.equal((await call({ op: 'save', entity: 'header_settings', id: headerId, record: { nav_items: [] } }, { db })).body.error, 'validation_failed')
  // Header fields validated.
  assert.equal((await call({ op: 'save', entity: 'header_settings', id: headerId, record: { announcement_link: 'javascript:alert(1)' } }, { db })).body.error, 'validation_failed')
  assert.equal((await call({ op: 'save', entity: 'header_settings', id: headerId, record: { social_items: { a: 1 } } }, { db })).body.error, 'validation_failed')
  // Colours as Main stores them (the live header border is rgba(255,255,255,0.1)); CSS injection refused.
  assert.equal((await call({ op: 'save', entity: 'header_settings', id: headerId, record: { header_border_color: 'rgba(255,255,255,0.1)' } }, { db })).status, 200)
  assert.equal(db.tables.header_settings[0].header_border_color, 'rgba(255,255,255,0.1)')
  assert.equal((await call({ op: 'save', entity: 'header_settings', id: headerId, record: { header_border_color: 'red;background:url(x)' } }, { db })).body.error, 'validation_failed')
  const header = await call({ op: 'save', entity: 'header_settings', id: headerId, record: { announcement_enabled: true, announcement_text: 'Admissions open', announcement_link: '/courses', announcement_bg_color: '#10b981', social_items: [{ platform: 'instagram', url: 'https://instagram.com/acadvizen' }] } }, { db })
  assert.equal(header.status, 200)
  assert.equal(header.revalidated[0][0], 'navigation')
  assert.deepEqual(db.tables.header_settings[0].nav_items, [{ label: 'Home' }])
  // Never created, deleted, hidden or trashed.
  assert.equal((await call({ op: 'save', entity: 'footer_settings', record: { copyright_text: 'x' } }, { db })).body.error, 'not_supported')
  for (const op of ['set_status', 'trash', 'delete']) {
    assert.equal((await call({ op, entity: 'header_settings', id: headerId, active: false, confirm: true }, { db })).body.error, 'not_supported', op)
  }
})

test('menus: links validated; showing a row also publishes it (the site needs is_active and status)', async () => {
  const db = fakeDb({ menus: [] })
  for (const bad of ['javascript:alert(1)', 'http://insecure.example', '//evil.example']) {
    assert.equal((await call({ op: 'save', entity: 'menus', record: { menu_location: 'header', title: 'X', url: bad } }, { db })).body.error, 'validation_failed', bad)
  }
  assert.equal((await call({ op: 'save', entity: 'menus', record: { menu_location: 'sidebar', title: 'X', url: '/x' } }, { db })).body.error, 'validation_failed')
  for (const good of ['/courses', 'https://wa.me/919999999999', '#faq', 'mailto:hello@acadvizen.com', 'tel:+91 98450 00000']) {
    assert.equal((await call({ op: 'save', entity: 'menus', record: { menu_location: 'footer', title: good, url: good } }, { db })).status, 200, good)
  }
  const created = db.tables.menus[0]
  assert.equal(created.is_active, false)
  assert.equal(created.status, 'draft', 'a new link is hidden until shown')
  await call({ op: 'set_status', entity: 'menus', id: created.id, active: true }, { db })
  assert.equal(created.is_active, true)
  assert.equal(created.status, 'published')
  const footer = await call({ op: 'list', entity: 'menus', filter: { menu_location: 'footer' } }, { db })
  assert.equal(footer.body.data.length, 5)
  assert.equal((await call({ op: 'list', entity: 'menus', filter: { menu_location: 'nowhere' } }, { db })).body.error, 'invalid_filter')
})

test('importing the links shown today: same titles, addresses and order; existing menus never touched', async () => {
  const db = fakeDb({ menus: [], site_settings: [{ id: 'default', ui_copy: {} }] })
  const first = await call({ op: 'import_menu_defaults', entity: 'menus' }, { db })
  assert.equal(first.status, 200)
  assert.deepEqual(first.body.data.imported, { header: 5, footer: 5, legal: 2 })
  const header = db.tables.menus.filter((r) => r.menu_location === 'header').sort((a, b) => a.order_index - b.order_index)
  assert.deepEqual(header.map((r) => [r.title, r.url, r.target]), [['Courses', '/courses', '_self'], ['Placement', '/placement', '_self'], ['Achievements', '/achievements', '_self'], ['Blog', '/blog', '_self'], ['Contact', '/contact', '_self']])
  assert.ok(db.tables.menus.every((r) => r.is_active === true && r.status === 'published' && r.desktop_visible && r.mobile_visible))
  // A second import changes nothing.
  const again = await call({ op: 'import_menu_defaults', entity: 'menus' }, { db })
  assert.deepEqual(again.body.data, { imported: {}, skipped: ['header', 'footer', 'legal'] })
  assert.equal(db.tables.menus.length, 12)

  // ui_copy lists win over the built-in ones, exactly as on the site; a location with rows is skipped.
  const db2 = fakeDb({
    menus: [{ id: randomUUID(), menu_location: 'footer', title: 'Mine', url: '/mine', is_active: true, status: 'published' }],
    site_settings: [{ id: 'default', ui_copy: { header_fallback_links: [{ title: 'Home', url: '/' }, { title: '', url: '/ignored' }] } }],
  })
  const second = await call({ op: 'import_menu_defaults', entity: 'menus', locations: ['header', 'footer'] }, { db: db2 })
  assert.deepEqual(second.body.data, { imported: { header: 1 }, skipped: ['footer'] })
  assert.deepEqual(db2.tables.menus.filter((r) => r.menu_location === 'footer').map((r) => r.title), ['Mine'])
  assert.equal((await call({ op: 'import_menu_defaults', entity: 'menus', locations: ['sidebar'] }, { db: db2 })).body.error, 'invalid_location')
  assert.equal((await call({ op: 'import_menu_defaults', entity: 'blogs' }, { db: db2 })).body.error, 'not_supported')
})
/* Homepage --------------------------------------------------------------------------------------- */
test('homepage lists: importing saves exactly what the homepage shows; existing lists are never touched', async () => {
  const mine = { id: randomUUID(), section_key: 'home_list_faq', title: 'FAQ', items_json: [{ question: 'Mine?', answer: 'Yes.' }], is_active: true }
  const db = fakeDb({ home_sections: [{ id: randomUUID(), section_key: 'who_for', title: 'Who Is This For?', items_json: [], is_active: true }, mine] })
  const first = await call({ op: 'import_homepage_defaults', entity: 'home_lists' }, { db })
  assert.equal(first.status, 200)
  assert.deepEqual(first.body.data.skipped, ['faq'])
  assert.equal(first.body.data.imported.length, Object.keys(HOME_LISTS).length - 1)
  for (const [key, list] of Object.entries(HOME_LISTS)) {
    if (key === 'faq') continue
    const row = db.tables.home_sections.find((r) => r.section_key === 'home_list_' + key)
    assert.deepEqual(row.items_json, list.defaults, key + ' saved verbatim')
    assert.equal(row.is_active, true)
  }
  assert.deepEqual(db.tables.home_sections.find((r) => r.id === mine.id).items_json, [{ question: 'Mine?', answer: 'Yes.' }])
  const again = await call({ op: 'import_homepage_defaults', entity: 'home_lists' }, { db })
  assert.deepEqual(again.body.data.imported, [])
  // Only lists are listed under home_lists; only the three drawn sections under home_sections.
  const lists = await call({ op: 'list', entity: 'home_lists', limit: 50 }, { db })
  assert.equal(lists.body.data.length, Object.keys(HOME_LISTS).length)
  const sections = await call({ op: 'list', entity: 'home_sections', limit: 50 }, { db })
  assert.deepEqual(sections.body.data.map((r) => r.section_key), ['who_for'])
  assert.equal((await call({ op: 'get', entity: 'home_sections', id: mine.id }, { db })).status, 404)
  assert.equal((await call({ op: 'get', entity: 'home_lists', id: db.tables.home_sections[0].id }, { db })).status, 404)
})

test('homepage lists: edits keep the shape the homepage draws', async () => {
  const faq = { id: randomUUID(), section_key: 'home_list_faq', title: 'FAQ', items_json: HOME_LISTS.faq.defaults, is_active: true }
  const lines = { id: randomUUID(), section_key: 'home_list_program_highlights', title: 'Highlights', items_json: HOME_LISTS.program_highlights.defaults, is_active: true }
  const modules = { id: randomUUID(), section_key: 'home_list_course_modules', title: 'Modules', items_json: HOME_LISTS.course_modules.defaults, is_active: true }
  const db = fakeDb({ home_sections: [faq, lines, modules] })
  const stored = (row) => db.tables.home_sections.find((r) => r.id === row.id)
  const ok = await call({ op: 'save', entity: 'home_lists', id: faq.id, record: { items_json: [{ question: ' Is it online? ', answer: 'Yes.' }, { question: '', answer: '' }] } }, { db })
  assert.equal(ok.status, 200)
  assert.deepEqual(stored(faq).items_json, [{ question: 'Is it online?', answer: 'Yes.' }], 'trimmed; empty items dropped')
  assert.equal(ok.revalidated[0][0], 'homepage_section')
  // A field the homepage does not have, a nested object, or the wrong kind of list: refused.
  for (const bad of [[{ question: 'Q', answer: 'A', onclick: 'x' }], [{ question: { a: 1 } }], ['just a line']]) {
    assert.equal((await call({ op: 'save', entity: 'home_lists', id: faq.id, record: { items_json: bad } }, { db })).body.error, 'validation_failed')
  }
  assert.equal((await call({ op: 'save', entity: 'home_lists', id: lines.id, record: { items_json: [{ question: 'Q' }] } }, { db })).body.error, 'validation_failed')
  assert.equal((await call({ op: 'save', entity: 'home_lists', id: lines.id, record: { items_json: ['One', ' Two '] } }, { db })).status, 200)
  assert.deepEqual(stored(lines).items_json, ['One', 'Two'])
  // Lists of lines inside items (module pillars) are kept as lists.
  const edited = HOME_LISTS.course_modules.defaults.map((m, i) => (i === 0 ? { ...m, pillars: ['A', 'B'] } : m))
  assert.equal((await call({ op: 'save', entity: 'home_lists', id: modules.id, record: { items_json: edited } }, { db })).status, 200)
  assert.deepEqual(stored(modules).items_json[0].pillars, ['A', 'B'])
  // Hiding a list brings back the built-in one; lists are never created or deleted directly.
  await call({ op: 'set_status', entity: 'home_lists', id: faq.id, active: false }, { db })
  assert.equal(stored(faq).is_active, false)
  assert.equal((await call({ op: 'save', entity: 'home_lists', record: { items_json: [] } }, { db })).body.error, 'not_supported')
  assert.equal((await call({ op: 'delete', entity: 'home_lists', id: faq.id, confirm: true }, { db })).body.error, 'not_supported')
})

test('homepage hero and closing call-to-action: only the drawn fields', async () => {
  const hero = { id: randomUUID(), heading: 'Learn AI Digital Marketing', video_url: '/v.mp4' }
  const cta = { id: randomUUID(), title: 'Master the skill set', button_link: '/courses' }
  const db = fakeDb({ homepage_hero: [hero], homepage_cta: [cta] })
  assert.equal((await call({ op: 'save', entity: 'homepage_hero', id: hero.id, record: { heading: 'New heading', badge_text: '100% Job Guaranteed*' } }, { db })).status, 200)
  assert.equal(db.tables.homepage_hero[0].video_url, '/v.mp4', 'fields not offered are kept')
  assert.equal((await call({ op: 'save', entity: 'homepage_hero', id: hero.id, record: { video_url: '/x.mp4' } }, { db })).body.error, 'validation_failed')
  assert.equal((await call({ op: 'save', entity: 'homepage_cta', id: cta.id, record: { button_link: 'javascript:alert(1)' } }, { db })).body.error, 'validation_failed')
  assert.equal((await call({ op: 'save', entity: 'homepage_cta', id: cta.id, record: { button_text: 'Enroll', button_link: '/register' } }, { db })).status, 200)
})

/* Courses --------------------------------------------------------------------------------------- */
test('courses: drawn fields validated; showing a course keeps every visibility column in step', async () => {
  const db = fakeDb({ courses: [] })
  const created = await call({ op: 'save', entity: 'courses', record: { title: 'AI Digital Marketing', slug: 'ai-digital-marketing', skills: ['SEO', ' GEO '], curriculum: [{ title: 'Module 1', topics: ['Prompting', 'AIO'] }], primary_cta_url: '/register', internship: true } }, { db })
  assert.equal(created.status, 200)
  const row = db.tables.courses[0]
  assert.deepEqual(row.skills, ['SEO', 'GEO'])
  assert.deepEqual(row.curriculum, [{ title: 'Module 1', topics: ['Prompting', 'AIO'] }])
  assert.equal(row.is_active, false, 'a new course is hidden until shown')
  await call({ op: 'set_status', entity: 'courses', id: row.id, active: true }, { db })
  assert.deepEqual([row.is_active, row.is_published, row.published, row.status], [true, true, true, 'published'])
  await call({ op: 'set_status', entity: 'courses', id: row.id, active: false }, { db })
  assert.deepEqual([row.is_active, row.is_published, row.published, row.status], [false, false, false, 'draft'])
  for (const bad of [{ curriculum: [{ title: 'M', topics: 'not a list' }] }, { curriculum: [{ title: 'M', extra: 1 }] }, { primary_cta_url: 'javascript:alert(1)' }, { learning_hours: -3 }]) {
    assert.equal((await call({ op: 'save', entity: 'courses', id: row.id, record: bad }, { db })).body.error, 'validation_failed', JSON.stringify(bad))
  }
  assert.equal((await call({ op: 'save', entity: 'courses', record: { title: 'Again', slug: 'ai-digital-marketing' } }, { db })).body.error, 'slug_taken')
  // Trash and restore.
  await call({ op: 'trash', entity: 'courses', id: row.id }, { db })
  assert.ok(row.deleted_at)
  await call({ op: 'restore', entity: 'courses', id: row.id }, { db })
  assert.equal(row.deleted_at, null)
})

test('course sections: listed for one course; deleting needs a confirmation', async () => {
  const courseId = randomUUID()
  const otherId = randomUUID()
  const db = fakeDb({ course_details: [
    { id: randomUUID(), course_id: courseId, section_title: 'Overview', content: 'x', order_index: 1 },
    { id: randomUUID(), course_id: otherId, section_title: 'Other course', content: 'y', order_index: 0 },
  ] })
  assert.equal((await call({ op: 'list', entity: 'course_details' }, { db })).body.error, 'parent_required')
  const list = await call({ op: 'list', entity: 'course_details', parent_id: courseId }, { db })
  assert.deepEqual(list.body.data.map((r) => r.section_title), ['Overview'])
  const added = await call({ op: 'save', entity: 'course_details', record: { course_id: courseId, section_title: 'Fees', content: 'Instalments available.', order_index: 2 } }, { db })
  assert.equal(added.status, 200)
  assert.equal((await call({ op: 'save', entity: 'course_details', record: { section_title: 'No course' } }, { db })).body.error, 'validation_failed')
  const id = added.body.data.id
  assert.equal((await call({ op: 'delete', entity: 'course_details', id }, { db })).body.error, 'confirmation_required')
  assert.equal((await call({ op: 'delete', entity: 'course_details', id, confirm: true }, { db })).status, 200)
  assert.equal(db.tables.course_details.length, 2)
})

/* City, service and location pages -------------------------------------------------------------- */
test('city pages: drawn fields only; item lists keep their fields', async () => {
  const db = fakeDb({ city_pages: [] })
  const ok = await call({ op: 'save', entity: 'city_pages', record: { city_name: 'Mysuru', slug: 'mysuru', hero_title: 'Digital marketing in Mysuru', features: [{ title: 'Live projects', text: 'Real clients', list: ['SEO', ' Ads '] }], stats: [{ label: 'Students', value: '500+' }], faqs: [{ question: 'Online?', answer: 'Yes.' }] } }, { db })
  assert.equal(ok.status, 200)
  const row = db.tables.city_pages[0]
  assert.deepEqual(row.features, [{ title: 'Live projects', text: 'Real clients', list: ['SEO', 'Ads'] }])
  assert.equal(row.is_active, false)
  for (const bad of [{ features: [{ title: 'x', onclick: 'y' }] }, { stats: 'many' }, { faqs: [{ question: { a: 1 } }] }]) {
    assert.equal((await call({ op: 'save', entity: 'city_pages', id: row.id, record: bad }, { db })).body.error, 'validation_failed', JSON.stringify(bad))
  }
})

test('pages and service pages share the /<address> space; fixed website routes are refused', async () => {
  const db = fakeDb({ pages: [{ id: randomUUID(), title: 'SEO course', slug: 'seo-course-in-bangalore', status: 'published', draft_of_id: null }], service_pages: [{ id: randomUUID(), title: 'Ads', slug: 'google-ads-course-in-bangalore' }] })
  assert.equal((await call({ op: 'save', entity: 'service_pages', record: { title: 'Clash', slug: 'seo-course-in-bangalore' } }, { db })).body.error, 'slug_taken')
  assert.equal((await call({ op: 'save', entity: 'pages', record: { title: 'Clash', slug: 'google-ads-course-in-bangalore' } }, { db })).body.error, 'slug_taken')
  for (const reserved of ['blog', 'courses', 'contact']) {
    assert.equal((await call({ op: 'save', entity: 'pages', record: { title: 'X', slug: reserved } }, { db })).body.error, 'slug_taken', reserved)
    assert.equal((await call({ op: 'save', entity: 'service_pages', record: { title: 'X', slug: reserved } }, { db })).body.error, 'slug_taken', reserved)
  }
  assert.equal((await call({ op: 'save', entity: 'service_pages', record: { title: 'Meta Ads course', slug: 'meta-ads-course-in-mysuru', benefits: [{ title: 'Live', description: 'Projects' }] } }, { db })).status, 200)
})

test('sections of city, service and location pages: same section types, with a position on the page', async () => {
  const cityId = randomUUID()
  const db = fakeDb({ city_pages: [{ id: cityId, city_name: 'Mysuru', slug: 'mysuru' }], city_page_sections: [], pages: [{ id: randomUUID(), title: 'P', slug: 'p' }], sections: [] })
  const saved = await call({ op: 'save', entity: 'sections', parent: 'city_pages', record: { page_id: cityId, type: 'faq', position: 'before_faq', content_json: { heading: 'Questions', items: [{ question: 'Q', answer: 'A' }] } } }, { db })
  assert.equal(saved.status, 200)
  assert.equal(db.tables.city_page_sections[0].city_page_id, cityId)
  assert.equal(db.tables.city_page_sections[0].position, 'before_faq')
  assert.equal(db.tables.sections.length, 0, 'page sections untouched')
  assert.equal(saved.revalidated[0][0], 'city_page')
  // Default position, invalid position, unknown parent, wrong parent id.
  await call({ op: 'save', entity: 'sections', parent: 'city_pages', record: { page_id: cityId, type: 'text_block', content_json: { heading: 'H' } } }, { db })
  assert.equal(db.tables.city_page_sections[1].position, 'end')
  assert.equal((await call({ op: 'save', entity: 'sections', parent: 'city_pages', record: { page_id: cityId, type: 'faq', position: 'sidebar' } }, { db })).body.error, 'invalid_section')
  assert.equal((await call({ op: 'save', entity: 'sections', parent: 'blogs', record: { page_id: cityId, type: 'faq' } }, { db })).body.error, 'invalid_parent')
  assert.equal((await call({ op: 'save', entity: 'sections', parent: 'service_pages', record: { page_id: cityId, type: 'faq' } }, { db })).body.error, 'page_not_found')
  const listed = await call({ op: 'list', entity: 'sections', parent: 'city_pages', page_id: cityId }, { db })
  assert.equal(listed.body.data.length, 2)
  // Pages keep working exactly as before (no position column).
  const pageId = db.tables.pages[0].id
  assert.equal((await call({ op: 'save', entity: 'sections', record: { page_id: pageId, type: 'hero', content_json: { heading: 'H' } } }, { db })).status, 200)
  assert.equal('position' in db.tables.sections[0], false)
})

test('a database refusal is generic for WordPress and logged (code and message, no content) for the developer', async () => {
  const db = fakeDb({ courses: [] })
  const realFrom = db.from
  db.from = (table) => { const q = realFrom(table); const insert = q.insert; q.insert = (row) => { insert(row); q.single = async () => ({ data: null, error: { code: '23502', message: 'null value in column "x" violates not-null constraint' } }); return q }; return q }
  const logged = []
  const r = await callWith({ op: 'save', entity: 'courses', record: { title: 'X', slug: 'x' } }, { db, deduper: createEventDeduper(), log: (level, details) => logged.push([level, details]) })
  assert.equal(r.status, 500)
  assert.deepEqual(r.body, { ok: false, error: 'database_error' })
  assert.equal(logged[0][0], 'database_error')
  assert.equal(logged[0][1].code, '23502')
  assert.match(logged[0][1].message, /not-null/)
  assert.equal(JSON.stringify(logged).includes('"title"'), false, 'no record content in the log')
})

test('empty values of required columns are left out (database default), not sent as null', async () => {
  const db = fakeDb({ courses: [], menus: [] })
  assert.equal((await call({ op: 'save', entity: 'courses', record: { title: 'Course', slug: 'course', order_index: '', noindex: false } }, { db })).status, 200)
  assert.equal('order_index' in db.tables.courses[0], false)
  assert.equal((await call({ op: 'save', entity: 'menus', record: { menu_location: 'footer', title: 'Home', url: '/', target: '', order_index: '' } }, { db })).status, 200)
  assert.equal('target' in db.tables.menus[0], false)
})

/* SEO overrides and media ------------------------------------------------------------------------ */
test('SEO overrides: shown on their page, editable, removable (then the page\'s own SEO applies)', async () => {
  const pageId = randomUUID()
  const overrideId = randomUUID()
  const db = fakeDb({
    pages: [{ id: pageId, title: 'SEO course', slug: 'seo-course-in-bangalore', status: 'published', draft_of_id: null, seo_title: 'Own title' }],
    seo_metadata: [{ id: overrideId, page_slug: 'seo-course-in-bangalore', meta_title: 'Override title', schema_json: { a: 1 } }],
    blog_content_blocks: [],
  })
  const page = await call({ op: 'get', entity: 'pages', id: pageId }, { db })
  assert.equal(page.body.data.seo_override.meta_title, 'Override title')
  const edited = await call({ op: 'save', entity: 'seo_metadata', id: overrideId, record: { meta_title: 'New override' } }, { db })
  assert.equal(edited.status, 200)
  assert.deepEqual(edited.revalidated[0], ['page', 'seo-course-in-bangalore'], 'the page at that address is refreshed')
  assert.deepEqual(db.tables.seo_metadata[0].schema_json, { a: 1 }, 'fields not offered are kept')
  assert.equal((await call({ op: 'save', entity: 'seo_metadata', record: { meta_title: 'x' } }, { db })).body.error, 'not_supported')
  assert.equal((await call({ op: 'delete', entity: 'seo_metadata', id: overrideId }, { db })).body.error, 'confirmation_required')
  assert.equal((await call({ op: 'delete', entity: 'seo_metadata', id: overrideId, confirm: true }, { db })).status, 200)
  assert.equal((await call({ op: 'get', entity: 'pages', id: pageId }, { db })).body.data.seo_override, null)
})

function fakeStorage(db) {
  const files = []
  db.storage = { from: (bucket) => ({
    upload: async (p, buf, opts) => { files.push({ bucket, path: p, size: buf.length, contentType: opts.contentType }); return { error: null } },
    getPublicUrl: (p) => ({ data: { publicUrl: `https://db.example.test/storage/v1/object/public/${bucket}/${p}` } }),
  }) }
  return files
}
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)])

test('media: an image is stored in Main\'s library; other types, wrong contents and large files are refused', async () => {
  const db = fakeDb({ media: [] })
  const files = fakeStorage(db)
  const ok = await call({ op: 'upload', entity: 'media', filename: 'Campus Photo.PNG', content_type: 'image/png', data: PNG.toString('base64'), alt_text: 'Our campus' }, { db })
  assert.equal(ok.status, 200)
  assert.equal(files[0].bucket, 'site-assets')
  assert.match(files[0].path, /^wordpress\/\d{4}\/\d{2}\/[0-9a-f]{8}-campus-photo\.png$/)
  assert.equal(db.tables.media[0].alt_text, 'Our campus')
  assert.match(ok.body.data.url, /\/site-assets\/wordpress\//)
  assert.equal((await call({ op: 'upload', entity: 'media', filename: 'x.svg', content_type: 'image/svg+xml', data: Buffer.from('<svg onload="alert(1)"/>').toString('base64') }, { db })).body.error, 'unsupported_type')
  assert.equal((await call({ op: 'upload', entity: 'media', filename: 'x.jpg', content_type: 'image/jpeg', data: PNG.toString('base64') }, { db })).body.error, 'invalid_file')
  assert.equal((await call({ op: 'upload', entity: 'media', filename: 'x.png', content_type: 'image/png', data: Buffer.from('not an image at all').toString('base64') }, { db })).body.error, 'invalid_file')
  const big = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)])
  assert.equal((await call({ op: 'upload', entity: 'media', filename: 'big.png', content_type: 'image/png', data: big.toString('base64') }, { db })).body.error, 'file_too_large')
  // Large bodies are only allowed for uploads.
  assert.equal((await call({ op: 'save', entity: 'testimonials', record: { name: 'x'.repeat(10), quote: 'y'.repeat(600 * 1024) } }, { db })).status, 413)
  // Metadata of library items can be edited; items are not created or deleted here.
  const id = db.tables.media[0].id
  assert.equal((await call({ op: 'save', entity: 'media', id, record: { alt_text: 'Campus, Jayanagar' } }, { db })).status, 200)
  assert.equal((await call({ op: 'delete', entity: 'media', id, confirm: true }, { db })).body.error, 'not_supported')
  assert.equal((await call({ op: 'save', entity: 'media', record: { name: 'x' } }, { db })).body.error, 'not_supported')
})

test('blog authors and categories: editable; one still used by a blog cannot be deleted', async () => {
  const authorId = randomUUID()
  const db = fakeDb({ authors: [{ id: authorId, name: 'Team Acadvizen', slug: 'team' }], blog_categories: [], blogs: [{ id: randomUUID(), title: 'B', slug: 'b', author_id: authorId }] })
  assert.equal((await call({ op: 'save', entity: 'blog_categories', record: { name: 'SEO', slug: 'seo' } }, { db })).status, 200)
  assert.equal((await call({ op: 'save', entity: 'authors', id: authorId, record: { bio: 'Trainers and practitioners.' } }, { db })).status, 200)
  const refused = await call({ op: 'delete', entity: 'authors', id: authorId, confirm: true }, { db })
  assert.equal(refused.body.error, 'in_use')
  assert.match(refused.body.details[0], /still used by 1 blogs/)
  const categoryId = db.tables.blog_categories[0].id
  assert.equal((await call({ op: 'delete', entity: 'blog_categories', id: categoryId, confirm: true }, { db })).status, 200)
  assert.equal((await call({ op: 'save', entity: 'blogs', id: db.tables.blogs[0].id, record: { author_id: 'not-a-uuid' } }, { db })).body.error, 'validation_failed')
})

test('addresses: malformed ones are refused, never normalised onto another record', async () => {
  const db = fakeDb({ pages: [{ id: randomUUID(), title: 'Existing', slug: 'taken', status: 'published' }] })
  for (const slug of ['Taken', 'taken/', '/taken', 'TAKEN', 'taken--x', '-taken', 'taken-', '../taken', 'taken?x=1', 'tak en', 'tāken']) {
    const r = await call({ op: 'save', entity: 'pages', record: { title: 'T', slug } }, { db })
    assert.equal(r.status, 400, `"${slug}" must be refused`)
    assert.equal(r.body.error, 'validation_failed', slug)
  }
  assert.equal(db.tables.pages.length, 1, 'nothing was created')
})

test('addresses: renaming a record onto an address in use is refused and leaves both records unchanged', async () => {
  const a = randomUUID()
  const b = randomUUID()
  const db = fakeDb({ pages: [{ id: a, title: 'A', slug: 'first', status: 'published' }, { id: b, title: 'B', slug: 'second', status: 'draft' }] })
  const r = await call({ op: 'save', entity: 'pages', id: b, record: { title: 'B', slug: 'first' } }, { db })
  assert.equal(r.status, 409)
  assert.equal(r.body.error, 'slug_taken')
  assert.deepEqual(db.tables.pages.map((p) => [p.id, p.slug]), [[a, 'first'], [b, 'second']])
  // A rename to a free address is accepted.
  assert.equal((await call({ op: 'save', entity: 'pages', id: b, record: { title: 'B', slug: 'second-renamed' } }, { db })).status, 200)
})

/* Edit conflicts (expected_updated_at): two editors, Main's /admin and WordPress, edit the same records. */

test('sameInstant compares timestamps across formats and treats empty as equal only to empty', async () => {
  const { sameInstant } = await import('../../lib/wordpress/contentApi.js')
  assert.equal(sameInstant('2026-10-10T12:00:00.000Z', '2026-10-10T12:00:00+00:00'), true)
  assert.equal(sameInstant('2026-10-10T17:30:00+05:30', '2026-10-10T12:00:00Z'), true)
  assert.equal(sameInstant('2026-10-10T12:00:00Z', '2026-10-10T12:00:01Z'), false)
  assert.equal(sameInstant(null, ''), true)
  assert.equal(sameInstant(null, '2026-10-10T12:00:00Z'), false)
  assert.equal(sameInstant('2026-10-10T12:00:00Z', undefined), false)
})

test('a save carrying the version it opened succeeds when nothing changed meanwhile', async () => {
  const db = fakeDb()
  await call({ op: 'save', entity: 'blogs', record: { title: 'First', slug: 'conflict-a' } }, { db })
  const row = db.tables.blogs[0]
  const opened = row.updated_at
  clock += 60_000
  const saved = await call({ op: 'save', entity: 'blogs', id: row.id, expected_updated_at: opened, record: { title: 'Second', slug: 'conflict-a' } }, { db })
  assert.equal(saved.status, 200)
  assert.equal(db.tables.blogs[0].title, 'Second')
  assert.notEqual(saved.body.data.updated_at, opened, 'the new version is returned for the next save')
})

test('a save on a stale version is refused (edit_conflict) and the other editor\'s change is kept', async () => {
  const db = fakeDb()
  await call({ op: 'save', entity: 'blogs', record: { title: 'Original', slug: 'conflict-b' } }, { db })
  const row = db.tables.blogs[0]
  const opened = row.updated_at
  // Meanwhile someone saves in Main's /admin (the database trigger bumps updated_at).
  Object.assign(row, { title: 'Changed in /admin', updated_at: new Date(clock + 30_000).toISOString() })
  clock += 60_000
  const stale = await call({ op: 'save', entity: 'blogs', id: row.id, expected_updated_at: opened, record: { title: 'Changed in WordPress', slug: 'conflict-b' } }, { db })
  assert.equal(stale.status, 409)
  assert.equal(stale.body.error, 'edit_conflict')
  assert.equal(stale.body.current_updated_at, row.updated_at)
  assert.equal(db.tables.blogs[0].title, 'Changed in /admin', 'nothing overwritten')
  assert.equal(stale.revalidated.length, 0)
  assert.equal(stale.audited.length, 0)
})

test('a change landing between the check and the write is caught by the conditional update', async () => {
  const db = fakeDb()
  await call({ op: 'save', entity: 'pages', record: { title: 'Race', slug: 'race-page' } }, { db })
  const row = db.tables.pages[0]
  const opened = row.updated_at
  // A database whose first update finds the row already changed by another writer.
  const racing = { ...db, from(table) {
    const api = db.from(table)
    const update = api.update.bind(api)
    api.update = (values) => { if (table === 'pages' && !racing.raced) { racing.raced = true; Object.assign(row, { title: 'Other writer', updated_at: new Date(clock + 1).toISOString() }) } return update(values) }
    return api
  } }
  clock += 60_000
  const result = await call({ op: 'save', entity: 'pages', id: row.id, expected_updated_at: opened, record: { title: 'Mine', slug: 'race-page' } }, { db: racing })
  assert.equal(result.body.error, 'edit_conflict')
  assert.equal(db.tables.pages[0].title, 'Other writer')
})

test('without expected_updated_at the save behaves exactly as before (Main /admin, older plugins)', async () => {
  const db = fakeDb()
  await call({ op: 'save', entity: 'blogs', record: { title: 'Old style', slug: 'conflict-c' } }, { db })
  const row = db.tables.blogs[0]
  Object.assign(row, { updated_at: new Date(clock + 5_000).toISOString() })
  clock += 60_000
  assert.equal((await call({ op: 'save', entity: 'blogs', id: row.id, record: { title: 'Last write', slug: 'conflict-c' } }, { db })).status, 200)
  assert.equal(db.tables.blogs[0].title, 'Last write')
})

test('records without timestamps (testimonials) ignore expected_updated_at', async () => {
  const db = fakeDb({ testimonials: [{ id: randomUUID(), name: 'A', is_active: true }] })
  const id = db.tables.testimonials[0].id
  assert.equal((await call({ op: 'save', entity: 'testimonials', id, expected_updated_at: '2020-01-01T00:00:00Z', record: { name: 'B' } }, { db })).status, 200)
})

/* Redirects edited from WordPress: Main's rules (lib/redirects.js) plus extra safeguards. */

const redirect = (db, record, id) => call({ op: 'save', entity: 'redirects', ...(id ? { id } : {}), record }, { db })

test('a new redirect is stored without a trailing slash and starts switched off', async () => {
  const db = fakeDb({ redirects: [], pages: [], blogs: [] })
  const r = await redirect(db, { from_path: '/old-course/', to_path: '/courses', status_code: '301' })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  assert.equal(db.tables.redirects[0].from_path, '/old-course')
  assert.equal(db.tables.redirects[0].status_code, 301)
  assert.equal(db.tables.redirects[0].is_active, false)
  assert.equal(r.revalidated.length, 0, 'the middleware reads redirects live: nothing to refresh')
})

test('redirects: malformed addresses and codes are refused', async () => {
  const db = fakeDb({ redirects: [], pages: [], blogs: [] })
  for (const record of [
    { from_path: 'no-slash', to_path: '/x' }, { from_path: '/has space', to_path: '/x' }, { from_path: '/q?x=1', to_path: '/x' },
    { from_path: '//evil.com', to_path: '/x' }, { from_path: '/a', to_path: 'javascript:alert(1)' }, { from_path: '/a', to_path: '/x', status_code: 303 },
    { from_path: '/a' },
  ]) assert.equal((await redirect(db, record)).body.error, 'validation_failed', JSON.stringify(record))
  assert.equal(db.tables.redirects.length, 0)
})

test('redirects: the website\'s own system addresses cannot be redirected', async () => {
  const db = fakeDb({ redirects: [], pages: [], blogs: [] })
  for (const from of ['/', '/admin', '/admin/leads', '/admin-login', '/api/wordpress/content', '/login', '/sitemap.xml']) {
    assert.equal((await redirect(db, { from_path: from, to_path: '/courses' })).body.error, 'redirect_not_allowed', from)
  }
})

test('redirects: no redirect to itself, one redirect per address, no chains or loops (either direction)', async () => {
  const db = fakeDb({ redirects: [{ id: randomUUID(), from_path: '/b', to_path: '/c', is_active: true }, { id: randomUUID(), from_path: '/x', to_path: '/y', is_active: true }], pages: [], blogs: [] })
  assert.equal((await redirect(db, { from_path: '/self', to_path: '/self/' })).body.error, 'redirect_loop')
  assert.equal((await redirect(db, { from_path: '/b', to_path: '/z' })).body.error, 'redirect_exists')
  assert.equal((await redirect(db, { from_path: '/a', to_path: '/b' })).body.error, 'redirect_chain', '/a -> /b -> /c')
  assert.equal((await redirect(db, { from_path: '/c', to_path: '/b' })).body.error, 'redirect_loop', '/c -> /b -> /c')
  assert.equal((await redirect(db, { from_path: '/y', to_path: '/w' })).body.error, 'redirect_chain', '/x -> /y -> /w')
  assert.equal((await redirect(db, { from_path: '/a', to_path: 'https://example.com/landing' })).status, 200)
})

test('redirects: a live page or blog is never hidden; a draft one does not count', async () => {
  const db = fakeDb({ redirects: [], pages: [{ id: randomUUID(), slug: 'live-page', status: 'published', deleted_at: null }, { id: randomUUID(), slug: 'draft-page', status: 'draft', deleted_at: null }], blogs: [{ id: randomUUID(), slug: 'live-post', status: 'published', deleted_at: null }] })
  assert.equal((await redirect(db, { from_path: '/live-page', to_path: '/courses' })).body.error, 'redirect_hides_page')
  assert.equal((await redirect(db, { from_path: '/blog/live-post', to_path: '/blog' })).body.error, 'redirect_hides_page')
  assert.equal((await redirect(db, { from_path: '/draft-page', to_path: '/courses' })).status, 200)
})

test('redirects: switching on runs the checks again (a page published meanwhile is protected)', async () => {
  const db = fakeDb({ redirects: [], pages: [], blogs: [] })
  await redirect(db, { from_path: '/new-offer', to_path: '/courses' })
  const id = db.tables.redirects[0].id
  db.tables.pages.push({ id: randomUUID(), slug: 'new-offer', status: 'published', deleted_at: null })
  const on = await call({ op: 'set_status', entity: 'redirects', id, active: true }, { db })
  assert.equal(on.body.error, 'redirect_hides_page')
  assert.equal(db.tables.redirects[0].is_active, false)
  db.tables.pages[0].status = 'draft'
  assert.equal((await call({ op: 'set_status', entity: 'redirects', id, active: true }, { db })).status, 200)
  assert.equal(db.tables.redirects[0].is_active, true)
})

test('redirects: deleting needs the redirect switched off and an explicit confirmation', async () => {
  const db = fakeDb({ redirects: [{ id: randomUUID(), from_path: '/gone', to_path: '/courses', is_active: true }], pages: [], blogs: [] })
  const id = db.tables.redirects[0].id
  assert.equal((await call({ op: 'delete', entity: 'redirects', id }, { db })).body.error, 'confirmation_required')
  assert.equal((await call({ op: 'delete', entity: 'redirects', id, confirm: true }, { db })).body.error, 'still_active')
  await call({ op: 'set_status', entity: 'redirects', id, active: false }, { db })
  assert.equal((await call({ op: 'delete', entity: 'redirects', id, confirm: true }, { db })).status, 200)
  assert.equal(db.tables.redirects.length, 0)
})

test('redirects: an empty "kind of redirect" uses the database default (301) instead of sending null', async () => {
  const db = fakeDb({ redirects: [], pages: [], blogs: [] })
  const r = await redirect(db, { from_path: '/no-code', to_path: '/courses', status_code: '' })
  assert.equal(r.status, 200)
  assert.equal('status_code' in db.tables.redirects[0], false, 'not sent, so the column default applies')
})
