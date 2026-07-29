import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeBlogStatus,
  isPublicBlogVisible,
  sortPublicBlogs,
} from '../../lib/blogVisibility.js'

test('normalizeBlogStatus maps live aliases to published', () => {
  assert.equal(normalizeBlogStatus('LIVE'), 'published')
  assert.equal(normalizeBlogStatus('active'), 'published')
  assert.equal(normalizeBlogStatus('draft'), 'draft')
})

test('isPublicBlogVisible hides drafts, future posts, deleted posts, and local E2E fixtures', () => {
  const now = new Date('2026-07-28T12:00:00.000Z')

  assert.equal(
    isPublicBlogVisible({
      title: 'Published Post',
      slug: 'published-post',
      status: 'published',
      published_at: '2026-07-20T00:00:00.000Z',
    }, { now }),
    true
  )

  assert.equal(
    isPublicBlogVisible({
      title: 'Draft Post',
      slug: 'draft-post',
      status: 'draft',
      published_at: '2026-07-20T00:00:00.000Z',
    }, { now }),
    false
  )

  assert.equal(
    isPublicBlogVisible({
      title: 'Future Post',
      slug: 'future-post',
      status: 'published',
      published_at: '2026-08-01T00:00:00.000Z',
    }, { now }),
    false
  )

  assert.equal(
    isPublicBlogVisible({
      title: 'Local E2E Admin Blog Test 1720000000',
      slug: 'local-1720000000',
      status: 'published',
      published_at: '2026-07-20T00:00:00.000Z',
      excerpt: 'local runtime testing only',
    }, { now }),
    false
  )

  assert.equal(
    isPublicBlogVisible({
      title: 'Deleted Post',
      slug: 'deleted-post',
      status: 'published',
      published_at: '2026-07-20T00:00:00.000Z',
      deleted_at: '2026-07-21T00:00:00.000Z',
    }, { now }),
    false
  )
})

test('sortPublicBlogs orders posts by newest public timestamp first', () => {
  const ordered = sortPublicBlogs([
    { slug: 'older', published_at: '2026-07-10T00:00:00.000Z' },
    { slug: 'newer', published_at: '2026-07-25T00:00:00.000Z' },
    { slug: 'middle', published_at: '2026-07-20T00:00:00.000Z' },
  ])

  assert.deepEqual(
    ordered.map((entry) => entry.slug),
    ['newer', 'middle', 'older']
  )
})
