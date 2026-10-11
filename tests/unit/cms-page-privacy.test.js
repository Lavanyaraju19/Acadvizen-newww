import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchCmsPagePrivacy, isSingleCmsSlugPath, shouldHidePage } from '../../lib/cmsPagePrivacy.js'

// A fake Supabase REST /pages endpoint: applies the slug and draft_of_id filters to `rows` in their
// stored order (so a draft copy stored before its live page is returned first, as happened in
// production), honours limit=1, and can simulate a database without the draft_of_id column.
function fakeRest(rows, { hasDraftColumn = true, failWith = 0 } = {}) {
  const calls = []
  const fetchImpl = async (url) => {
    const u = new URL(url)
    calls.push(u.search)
    if (failWith) return { ok: false, status: failWith, json: async () => ({}) }
    if (u.searchParams.has('draft_of_id') && !hasDraftColumn) return { ok: false, status: 400, json: async () => ({ code: '42703' }) }
    const slug = u.searchParams.get('slug').replace(/^eq\./, '')
    let found = rows.filter((r) => r.slug === slug)
    if (u.searchParams.get('draft_of_id') === 'is.null') found = found.filter((r) => !r.draft_of_id)
    return { ok: true, status: 200, json: async () => found.slice(0, Number(u.searchParams.get('limit') || 1000)) }
  }
  return { fetchImpl, calls }
}
const config = (fake) => ({ supabaseUrl: 'https://db.example.test', key: 'test-key', fetchImpl: fake.fetchImpl })
const live = { id: 'live-1', slug: 'seo-course', status: 'published', draft_of_id: null }
const copy = (status = 'draft') => ({ id: 'copy-1', slug: 'seo-course', status, draft_of_id: 'live-1' })

test('a published page without a draft is served', async () => {
  const privacy = await fetchCmsPagePrivacy('/seo-course', config(fakeRest([live])))
  assert.deepEqual(privacy, { exists: true, published: true })
  assert.equal(shouldHidePage(privacy), false)
})

test('a published page stays served while a private draft copy shares its address (the live 404 defect)', async () => {
  // The copy is stored first: before the fix this row was returned and the live page answered 404.
  const fake = fakeRest([copy(), live])
  const privacy = await fetchCmsPagePrivacy('/seo-course', config(fake))
  assert.equal(shouldHidePage(privacy), false)
  assert.match(fake.calls[0], /draft_of_id=is\.null/)
})

test('editing, submitting and discarding the draft copy never hides the live page', async () => {
  for (const state of [[copy('draft'), live], [copy('review'), live], [copy('approved'), live], [live]]) {
    assert.equal(shouldHidePage(await fetchCmsPagePrivacy('/seo-course', config(fakeRest(state)))), false)
  }
  // Published draft merged onto the live row (publish_page_draft): the copy is gone, the live row remains.
  const merged = { ...live, status: 'published' }
  assert.equal(shouldHidePage(await fetchCmsPagePrivacy('/seo-course', config(fakeRest([merged])))), false)
})

test('a new page that was never published stays hidden', async () => {
  const privacy = await fetchCmsPagePrivacy('/new-page', config(fakeRest([{ id: 'n', slug: 'new-page', status: 'draft', draft_of_id: null }])))
  assert.deepEqual(privacy, { exists: true, published: false })
  assert.equal(shouldHidePage(privacy), true)
})

test('an unpublished (archived) live page with a draft copy stays hidden', async () => {
  const privacy = await fetchCmsPagePrivacy('/seo-course', config(fakeRest([copy(), { ...live, status: 'archived' }])))
  assert.equal(shouldHidePage(privacy), true)
})

test('reserved application routes, nested paths and files are never looked up', async () => {
  const fake = fakeRest([{ id: 'x', slug: 'blog', status: 'draft', draft_of_id: null }])
  for (const path of ['/blog', '/tools', '/about', '/admin', '/blog/some-post', '/tools/canva', '/robots.txt', '/', '']) {
    assert.equal(await fetchCmsPagePrivacy(path, config(fake)), null, path)
    assert.equal(isSingleCmsSlugPath(path), false, path)
  }
  assert.equal(fake.calls.length, 0)
})

test('unknown addresses and alias addresses with no stored page are left to the page route', async () => {
  const privacy = await fetchCmsPagePrivacy('/no-such-page', config(fakeRest([live])))
  assert.equal(privacy, null)
  assert.equal(shouldHidePage(privacy), false)
})

test('a database without the staged-editing column falls back to the plain lookup', async () => {
  const fake = fakeRest([live], { hasDraftColumn: false })
  assert.deepEqual(await fetchCmsPagePrivacy('/seo-course', config(fake)), { exists: true, published: true })
  assert.equal(fake.calls.length, 2)
  assert.doesNotMatch(fake.calls[1], /draft_of_id/)
})

test('a failed lookup or missing configuration hides nothing (the page route still checks publication)', async () => {
  assert.equal(await fetchCmsPagePrivacy('/seo-course', config(fakeRest([live], { failWith: 503 }))), null)
  assert.equal(await fetchCmsPagePrivacy('/seo-course', { supabaseUrl: '', key: 'k', fetchImpl: fakeRest([live]).fetchImpl }), null)
  assert.equal(shouldHidePage(null), false)
})
