import test from 'node:test'
import assert from 'node:assert/strict'

import { blogs as localBlogs } from '../../data/blogs.js'
import { getSafeLocalBlogs, findLocalBlogBySlug, resolveBlogSlug } from '../../lib/blogSlugResolver.js'

test('data/blogs.js is never a sparse array (regression: stray comma created an elided hole)', () => {
  // A stray `},\n  ,{` between two entries elides an array slot instead of just being an
  // extra comma. `Array.prototype.find`/`forEach` visit holes and hand the callback
  // `undefined`, which crashed every `localBlogs.find(...)` call site with
  // "Cannot read properties of undefined (reading 'slug')" - this is exactly what shipped
  // and broke the homepage's blog section. Guard against it ever coming back.
  assert.ok(Array.isArray(localBlogs))
  for (let i = 0; i < localBlogs.length; i += 1) {
    assert.ok(i in localBlogs, `data/blogs.js has a sparse-array hole at index ${i}`)
  }
})

test('data/blogs.js entries are all well-formed objects with a non-empty slug', () => {
  for (const entry of localBlogs) {
    assert.ok(entry && typeof entry === 'object', 'every local blog entry must be an object')
    assert.equal(typeof entry.slug, 'string')
    assert.ok(entry.slug.trim().length > 0, 'every local blog entry must have a non-empty slug')
  }
})

test('getSafeLocalBlogs drops a sparse-array hole instead of returning undefined entries', () => {
  const withHole = [
    { id: 'a', slug: 'a' },
    // eslint-disable-next-line no-sparse-arrays
    ,
    { id: 'b', slug: 'b' },
  ]
  const safe = getSafeLocalBlogs(withHole)
  assert.equal(safe.length, 2)
  assert.ok(safe.every((entry) => entry !== undefined))
  assert.deepEqual(safe.map((entry) => entry.slug), ['a', 'b'])
})

test('getSafeLocalBlogs drops null entries and non-object entries', () => {
  const safe = getSafeLocalBlogs([
    { id: 'a', slug: 'a' },
    null,
    undefined,
    'not-an-object',
    42,
    { id: 'b', slug: 'b' },
  ])
  assert.deepEqual(safe.map((entry) => entry.slug), ['a', 'b'])
})

test('getSafeLocalBlogs drops entries with a missing or blank slug', () => {
  const safe = getSafeLocalBlogs([
    { id: 'a', slug: 'a' },
    { id: 'no-slug' },
    { id: 'blank-slug', slug: '   ' },
  ])
  assert.deepEqual(safe.map((entry) => entry.slug), ['a'])
})

test('getSafeLocalBlogs deduplicates repeated slugs, keeping the first occurrence', () => {
  const safe = getSafeLocalBlogs([
    { id: 'a1', slug: 'dup', title: 'first' },
    { id: 'a2', slug: 'dup', title: 'second' },
    { id: 'b', slug: 'unique' },
  ])
  assert.equal(safe.length, 2)
  assert.equal(safe.find((entry) => entry.slug === 'dup').title, 'first')
})

test('getSafeLocalBlogs returns an empty array for non-array input', () => {
  // `undefined` is intentionally excluded here: the default parameter
  // (`rawBlogs = localBlogs`) only activates for an *omitted* argument, and JS applies that
  // same default when `undefined` is passed explicitly - so getSafeLocalBlogs(undefined)
  // correctly falls back to the real local blog registry, not an empty array.
  assert.deepEqual(getSafeLocalBlogs(null), [])
  assert.deepEqual(getSafeLocalBlogs('nope'), [])
  assert.deepEqual(getSafeLocalBlogs(42), [])
})

test('getSafeLocalBlogs() with no argument defaults to the real local blog registry', () => {
  const safe = getSafeLocalBlogs()
  assert.ok(safe.length > 0)
  assert.ok(safe.every((entry) => entry && typeof entry.slug === 'string' && entry.slug))
})

test('findLocalBlogBySlug / resolveBlogSlug tolerate a sparse array without throwing', () => {
  const withHole = [
    { id: 'a', slug: 'career-in-digital-marketing-2026', title: 'Career Guide' },
    ,
    { id: 'b', slug: 'other-post' },
  ]

  assert.doesNotThrow(() => resolveBlogSlug('career-in-digital-marketing-2026', withHole))
  assert.doesNotThrow(() => findLocalBlogBySlug('career-in-digital-marketing-2026', withHole))
  assert.equal(resolveBlogSlug('career-in-digital-marketing-2026', withHole), 'career-in-digital-marketing-2026')
  assert.equal(findLocalBlogBySlug('career-in-digital-marketing-2026', withHole)?.id, 'a')
})
