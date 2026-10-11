import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { handleContentRequest, blogPlainText, createRequestClaimer } from '../../lib/wordpress/contentApi.js'
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
function callWith(body, { db, claimRequest, deduper } = {}) {
  const rawBody = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'tester' }, ...body })
  const timestamp = Math.floor(clock / 1000)
  return handleContentRequest({
    rawBody,
    headers: { 'x-acadvizen-timestamp': String(timestamp), 'x-acadvizen-signature': signPayload(rawBody, timestamp, SECRET) },
    config,
    deps: { db, claimRequest, deduper, ...fakePageDeps(db), revalidate: async () => ({ ok: true }), audit: async () => {} },
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
