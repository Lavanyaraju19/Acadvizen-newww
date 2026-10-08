import test from 'node:test'
import assert from 'node:assert/strict'

import { mapWordPressBlog, safeImageUrl, sanitizeBlocks } from '../../lib/wordpress/blogMapper.js'

const HOST = 'staging.enroll.example'

function apiItem(overrides = {}) {
  return {
    id: 42,
    slug: 'ai-tools-for-marketers',
    title: 'AI Tools for Marketers',
    excerpt: 'A short summary.',
    featured_image: { url: `https://${HOST}/wp-content/uploads/2026/10/cover.jpg`, width: 1200, height: 800, alt: 'Cover' },
    author_name: 'Acadvizen Team',
    category: 'AI',
    noindex: false,
    publish_to: 'main',
    published_at: '2026-10-01T09:00:00+00:00',
    modified_at: '2026-10-02T09:00:00+00:00',
    seo: { title: 'SEO title', description: 'SEO description' },
    blocks: [{ block_type: 'paragraph', content_json: { text: 'Hello' } }],
    ...overrides,
  }
}

test('maps an API blog into the Supabase blog shape used by the existing pages', () => {
  const blog = mapWordPressBlog(apiItem(), { imageHostname: HOST })
  assert.equal(blog.slug, 'ai-tools-for-marketers')
  assert.equal(blog.title, 'AI Tools for Marketers')
  assert.equal(blog.description, 'A short summary.')
  assert.equal(blog.status, 'published')
  assert.equal(blog.source, 'wordpress')
  assert.equal(blog.featured_image, `https://${HOST}/wp-content/uploads/2026/10/cover.jpg`)
  assert.deepEqual(blog.categories, ['AI'])
  assert.deepEqual(blog.author, { name: 'Acadvizen Team' })
  assert.equal(blog.seo_title, 'SEO title')
  assert.equal(blog.published_at, '2026-10-01T09:00:00.000Z')
  assert.deepEqual(blog.content_json.blocks, [{ block_type: 'paragraph', content_json: { text: 'Hello' } }])
})

test('rejects items that are not targeted at the Main Website or are incomplete', () => {
  assert.equal(mapWordPressBlog(apiItem({ publish_to: 'enrollment' }), { imageHostname: HOST }), null)
  assert.equal(mapWordPressBlog(apiItem({ slug: 'Bad Slug' }), { imageHostname: HOST }), null)
  assert.equal(mapWordPressBlog(apiItem({ title: '' }), { imageHostname: HOST }), null)
  assert.equal(mapWordPressBlog(apiItem({ published_at: 'not a date' }), { imageHostname: HOST }), null)
  assert.equal(mapWordPressBlog(null), null)
  assert.ok(mapWordPressBlog(apiItem({ publish_to: 'both' }), { imageHostname: HOST }))
})

test('only trusts images from the configured WordPress host', () => {
  assert.equal(safeImageUrl(`https://${HOST}/wp-content/uploads/a.jpg`, HOST), `https://${HOST}/wp-content/uploads/a.jpg`)
  assert.equal(safeImageUrl('https://evil.example/a.jpg', HOST), null)
  assert.equal(safeImageUrl(`http://${HOST}/a.jpg`, HOST), null)
  assert.equal(safeImageUrl('javascript:alert(1)', HOST), null)
  const blog = mapWordPressBlog(apiItem({ featured_image: { url: 'https://evil.example/x.jpg' } }), { imageHostname: HOST })
  assert.equal(blog.featured_image, null)
})

test('sanitizeBlocks keeps only known block types with plain-text fields', () => {
  const blocks = sanitizeBlocks(
    [
      { block_type: 'heading', content_json: { text: 'Intro', level: 9 } },
      { block_type: 'paragraph', content_json: { text: '<script>alert(1)</script>', html: '<b>x</b>' } },
      { block_type: 'list', content_json: { items: ['one', '', 2, 'three'] } },
      { block_type: 'quote', content_json: { text: 'Quote', author: 'Someone' } },
      { block_type: 'image', content_json: { src: `https://${HOST}/wp-content/uploads/a.jpg`, alt: 'A', onerror: 'x' } },
      { block_type: 'image', content_json: { src: 'https://evil.example/a.jpg' } },
      { block_type: 'video', content_json: { embed_url: 'https://www.youtube.com/embed/abc123' } },
      { block_type: 'video', content_json: { embed_url: 'https://evil.example/embed' } },
      { block_type: 'html', content_json: { html: '<iframe src=x>' } },
      { block_type: 'paragraph', content_json: { text: '   ' } },
    ],
    { imageHostname: HOST }
  )
  assert.deepEqual(blocks, [
    { block_type: 'heading', content_json: { text: 'Intro', level: 2 } },
    // Text is kept verbatim as plain text; React escapes it when rendering, so it can never execute.
    { block_type: 'paragraph', content_json: { text: '<script>alert(1)</script>' } },
    { block_type: 'list', content_json: { items: ['one', 'three'] } },
    { block_type: 'quote', content_json: { text: 'Quote', author: 'Someone' } },
    { block_type: 'image', content_json: { src: `https://${HOST}/wp-content/uploads/a.jpg`, alt: 'A', caption: '' } },
    { block_type: 'video', content_json: { embed_url: 'https://www.youtube.com/embed/abc123', title: '' } },
  ])
  assert.deepEqual(sanitizeBlocks('nope'), [])
})
