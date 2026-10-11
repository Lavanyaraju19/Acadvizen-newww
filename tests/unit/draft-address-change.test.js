import test from 'node:test'
import assert from 'node:assert/strict'
import { applyPublishedAddressChange, liveAddressBeforePublish } from '../../lib/draftAddressChange.js'

const db = (rows) => ({
  from: () => ({ select: () => ({ eq: (col, val) => ({ maybeSingle: async () => ({ data: rows.find((r) => r[col] === val) || null }) }) }) }),
})
const recorder = () => {
  const calls = []
  return {
    calls,
    createRedirect: async (_db, r) => { calls.push(['redirect', r.fromPath, r.toPath, r.statusCode]) },
    moveSeo: async (_db, m) => { calls.push(['seo', m.fromSlug, m.toSlug]) },
  }
}

test('the live address is read from the live page, not from the draft copy', async () => {
  const supabase = db([{ id: 'live', slug: 'old-address' }])
  assert.equal(await liveAddressBeforePublish(supabase, { id: 'copy', slug: 'new-address', draft_of_id: 'live' }), 'old-address')
  assert.equal(await liveAddressBeforePublish(supabase, { id: 'p', slug: 'plain', draft_of_id: null }), 'plain')
  assert.equal(await liveAddressBeforePublish(supabase, null), '')
})

test('a draft copy that renamed the address moves the live page only when published', async () => {
  const r = recorder()
  const out = await applyPublishedAddressChange({}, { draft: { draft_of_id: 'live' }, previousSlug: 'old-address', live: { slug: 'new-address' } }, r)
  assert.deepEqual(r.calls, [['redirect', '/old-address', '/new-address', 301], ['seo', 'old-address', 'new-address']])
  assert.deepEqual(out, { previousSlug: 'old-address', warning: null })
})

test('no redirect when the address is unchanged or the page was never live', async () => {
  for (const args of [
    { draft: { draft_of_id: 'live' }, previousSlug: 'same', live: { slug: 'same' } },
    { draft: { draft_of_id: null }, previousSlug: 'a', live: { slug: 'b' } },
    { draft: { draft_of_id: 'live' }, previousSlug: '', live: { slug: 'b' } },
  ]) {
    const r = recorder()
    assert.deepEqual(await applyPublishedAddressChange({}, args, r), { previousSlug: '', warning: null })
    assert.deepEqual(r.calls, [])
  }
})

test('a failed redirect is reported, the SEO settings still move and the publish stands', async () => {
  const r = recorder()
  r.createRedirect = async () => { throw new Error('redirect table unavailable') }
  const out = await applyPublishedAddressChange({}, { draft: { draft_of_id: 'live' }, previousSlug: 'old', live: { slug: 'new' } }, r)
  assert.equal(out.previousSlug, 'old')
  assert.match(out.warning, /redirect from the old address could not be created/)
  assert.deepEqual(r.calls, [['seo', 'old', 'new']])
})
