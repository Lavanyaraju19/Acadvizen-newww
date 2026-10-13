import test from 'node:test'
import assert from 'node:assert/strict'

import { fetchPublishedRecordBySlug, resolvePublicCmsRecordBySlug } from '../../lib/cmsPublishing.js'

// A small stand-in for the Supabase query builder that really applies eq / is filters to in-memory
// rows (the or() scheduling filters pass rows whose scheduling columns are empty, as in these tests),
// counts queries and optionally answers after `delay` ms.
function fakeSupabase(tables, { delay = 0, failProbe = false, missingColumns = {} } = {}) {
  const stats = { queries: 0, byTable: {} }
  return {
    stats,
    from(table) {
      stats.queries += 1
      stats.byTable[table] = (stats.byTable[table] || 0) + 1
      const filters = []
      const used = []
      let selected = '*'
      const builder = {
        select(columns) { selected = columns; return builder },
        eq(column, value) { used.push(column); filters.push((row) => row[column] === value); return builder },
        is(column, value) { used.push(column); filters.push((row) => (row[column] ?? null) === value); return builder },
        or(value) { used.push(String(value).split('.')[0]); return builder },
        limit() { return builder },
        then(resolve) {
          setTimeout(() => {
            if (failProbe && selected !== '*') return resolve({ data: null, error: { message: 'probe failed' } })
            const missing = used.find((c) => (missingColumns[table] || []).includes(c))
            if (missing) return resolve({ data: null, error: { code: '42703', message: `column ${table}.${missing} does not exist` } })
            if (!(table in tables)) return resolve({ data: null, error: { code: '42P01', message: `relation "${table}" does not exist` } })
            resolve({ data: tables[table].filter((row) => filters.every((f) => f(row))).slice(0, 1), error: null })
          }, delay)
        },
      }
      return builder
    },
  }
}

const published = { id: 'p1', slug: 'seo-course', status: 'published', deleted_at: null }
const draft = { id: 'd1', slug: 'draft-page', status: 'draft', deleted_at: null }
const lookup = (supabase, slug, extra = {}) => fetchPublishedRecordBySlug(supabase, { table: 'pages', slug, statusField: 'status', contentType: 'page', ...extra })

test('a published record is found on the first strategy, as before', async () => {
  const supabase = fakeSupabase({ pages: [published, draft] })
  assert.deepEqual(await lookup(supabase, 'seo-course'), published)
  assert.equal(supabase.stats.byTable.pages, 2, 'one strategy query plus the existence check')
})

test('a slug with no row ends after one round trip instead of trying every fallback', async () => {
  const supabase = fakeSupabase({ pages: [published, draft] })
  assert.equal(await lookup(supabase, 'tool-ahrefs'), null)
  assert.equal(supabase.stats.byTable.pages, 2, 'previously 3 sequential strategy queries')
})

test('an existing but unpublished record still goes through every fallback and stays hidden', async () => {
  const supabase = fakeSupabase({ pages: [published, draft] })
  assert.equal(await lookup(supabase, 'draft-page'), null)
  assert.equal(supabase.stats.byTable.pages, 4, '3 strategies plus the existence check')
})

test('if the existence check fails, the original fallbacks run unchanged', async () => {
  const supabase = fakeSupabase({ pages: [published] }, { failProbe: true })
  assert.equal(await lookup(supabase, 'missing'), null)
  assert.equal(supabase.stats.byTable.pages, 4)
  assert.deepEqual(await lookup(fakeSupabase({ pages: [published] }, { failProbe: true }), 'seo-course'), published)
})

test('preview lookups are unchanged (single query, no existence check)', async () => {
  const supabase = fakeSupabase({ pages: [draft] })
  assert.deepEqual(await lookup(supabase, 'draft-page', { preview: true }), draft)
  assert.equal(supabase.stats.byTable.pages, 1)
})

test('a miss across several content types costs one round trip per table', async () => {
  const supabase = fakeSupabase({ pages: [published], location_pages: [], service_pages: [] }, { delay: 40 })
  const t0 = Date.now()
  const match = await resolvePublicCmsRecordBySlug(supabase, { slug: 'tool-ahrefs', contentTypes: ['page', 'location_page', 'service_page'] })
  const elapsed = Date.now() - t0
  assert.equal(match, null)
  assert.ok(elapsed < 3 * 40 * 2, `took ${elapsed} ms; the old fallbacks needed at least 9 sequential round trips (360 ms)`)
})

test('the first matching content type still wins', async () => {
  const location = { id: 'l1', slug: 'jayanagar', status: 'published', deleted_at: null }
  const supabase = fakeSupabase({ pages: [], location_pages: [location], service_pages: [] })
  const match = await resolvePublicCmsRecordBySlug(supabase, { slug: 'jayanagar', contentTypes: ['page', 'location_page', 'service_page'] })
  assert.equal(match?.contentType, 'location_page')
  assert.deepEqual(match?.record, location)
})

test('missing-column retries also stop early when the slug has no row', async () => {
  const opts = { missingColumns: { service_pages: ['deleted_at', 'published_at', 'scheduled_publish_at', 'scheduled_unpublish_at'] } }
  const service = { id: 's1', slug: 'seo-in-jayanagar', status: 'published' }
  const miss = fakeSupabase({ service_pages: [service] }, opts)
  assert.equal(await fetchPublishedRecordBySlug(miss, { table: 'service_pages', slug: 'tool-ahrefs', statusField: 'status', contentType: 'service_page' }), null)
  assert.equal(miss.stats.byTable.service_pages, 2, 'one strategy query plus the existence check, instead of a retry per missing column')
  const hit = fakeSupabase({ service_pages: [service] }, opts)
  assert.deepEqual(await fetchPublishedRecordBySlug(hit, { table: 'service_pages', slug: 'seo-in-jayanagar', statusField: 'status', contentType: 'service_page' }), service)
})

test('a custom select list keeps the original fallbacks (no existence check)', async () => {
  const supabase = fakeSupabase({ pages: [published] })
  assert.equal(await lookup(supabase, 'tool-ahrefs', { select: 'id,slug,status' }), null)
  assert.equal(supabase.stats.byTable.pages, 3)
})
