import test from 'node:test'
import assert from 'node:assert/strict'

import {
  filterAvailableWordPressBlogs,
  mergeBlogLists,
  staticBlogSlugConflict,
} from '../../lib/wordpress/blogPrecedence.js'

const supabaseBlog = (slug, publishedAt, extra = {}) => ({ id: `sb-${slug}`, slug, title: `Main ${slug}`, published_at: publishedAt, ...extra })
const wordpressBlog = (slug, publishedAt) => ({ id: `wordpress-${slug}`, slug, title: `WP ${slug}`, published_at: publishedAt, source: 'wordpress' })

test('an existing Main (Supabase) blog always wins over a WordPress blog with the same slug', () => {
  const merged = mergeBlogLists(
    [supabaseBlog('seo-basics', '2026-01-01T00:00:00Z')],
    [wordpressBlog('seo-basics', '2026-09-01T00:00:00Z'), wordpressBlog('new-post', '2026-09-02T00:00:00Z')]
  )
  assert.deepEqual(merged.map((blog) => blog.id), ['wordpress-new-post', 'sb-seo-basics'])
})

test('Supabase rows are passed through unchanged and the list is newest first', () => {
  const original = supabaseBlog('a', '2026-05-01T00:00:00Z', { tags: ['x'] })
  const merged = mergeBlogLists([original], [wordpressBlog('b', '2026-06-01T00:00:00Z'), wordpressBlog('c', '2026-04-01T00:00:00Z')])
  assert.deepEqual(merged.map((blog) => blog.slug), ['b', 'a', 'c'])
  assert.equal(merged[1], original)
})

test('aliases and reserved sub-routes can never be taken by WordPress', () => {
  assert.equal(staticBlogSlugConflict('category'), 'reserved')
  assert.equal(staticBlogSlugConflict('tag'), 'reserved')
  assert.equal(staticBlogSlugConflict('mba-vs-digital-marketing-2026'), 'alias')
  assert.equal(staticBlogSlugConflict('brand-new-topic'), null)
  const merged = mergeBlogLists([], [wordpressBlog('category', '2026-01-01T00:00:00Z'), wordpressBlog('mba-vs-digital-marketing-2026', '2026-01-01T00:00:00Z')])
  assert.deepEqual(merged, [])
})

test('WordPress blogs whose slug is owned by any Main blog (including unpublished) are dropped', () => {
  const available = filterAvailableWordPressBlogs(
    [wordpressBlog('owned-by-draft', '2026-01-01T00:00:00Z'), wordpressBlog('free-slug', '2026-01-01T00:00:00Z'), wordpressBlog('author', '2026-01-01T00:00:00Z')],
    new Set(['owned-by-draft'])
  )
  assert.deepEqual(available.map((blog) => blog.slug), ['free-slug'])
})
