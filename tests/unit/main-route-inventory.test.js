import test from 'node:test'
import assert from 'node:assert/strict'

import { classify, visibleLines } from '../../tools/main-route-inventory.mjs'
import { compareRow, textCoverage } from '../../tools/main-migration-compare.mjs'

test('route inventory: each Main address gets its family and migration target', () => {
  assert.equal(classify('/').family, 'homepage')
  assert.equal(classify('/blog/what-is-seo').family, 'blog post')
  assert.equal(classify('/blog').family, 'blog list')
  assert.equal(classify('/blog/category/seo').family, 'blog taxonomy')
  assert.equal(classify('/tools/ahrefs').family, 'tool page')
  assert.equal(classify('/about').family, 'dedicated page')
  assert.equal(classify('/digital-marketing-course-mysore').family, 'programmatic city page')
  assert.equal(classify('/seo-course-in-jayanagar').family, 'Page Builder page')
  assert.equal(classify('/courses/ai-digital-marketing').target, 'stays Main (structured editing already live)')
  assert.match(classify('/admin').target, /never replaceable/)
})

test('route inventory: visible text leaves out scripts, styles, metadata and a streamed <title>', () => {
  const html = '<html><head><title>T | A</title></head><body><title>T | A</title><meta name="x" content="y"><script>var hidden=1</script><style>.a{}</style><h1>Heading here</h1><p>Body &amp; more text</p><p>Body &amp; more text</p></body></html>'
  assert.deepEqual(visibleLines(html), ['Heading here', 'Body & more text'])
})

test('migration comparison: text kept, and every check per address', () => {
  assert.equal(textCoverage(['one line', 'two line'], ['one line here', 'other']), 0.5)
  assert.equal(textCoverage([], ['x']), 1)
  const before = { path: '/a', family: 'dedicated page', status: 200, title: 'A', description: 'd', canonical: 'c', robots: '', h1: 'H', json_ld: 1, forms: 1, text: ['Hello world'] }
  assert.deepEqual(compareRow(before, { ...before }).failed, [])
  assert.deepEqual(compareRow(before, { ...before, title: 'B', forms: 0, text: [] }).failed, ['title', 'forms', 'text'])
  assert.deepEqual(compareRow(before, undefined).failed, ['status', 'title', 'description', 'canonical', 'h1', 'json_ld', 'forms', 'text'])
})

test('link check: only same-website page links, normalised, no files or anchors', async () => {
  const { internalLinks } = await import('../../tools/main-link-check.mjs')
  const html = '<a href="/about/">A</a><a href="https://www.acadvizen.com/blog/x">B</a><a href="https://other.com/y">C</a><a href="#top">D</a><a href="mailto:a@b.c">E</a><a href="/brochure.pdf">F</a><a href="/tools?q=1&amp;p=2">G</a>'
  assert.deepEqual(internalLinks(html, 'https://www.acadvizen.com/'), ['/about', '/blog/x', '/tools?q=1&p=2'])
})

test('compare: an address whose text could not be read never passes', () => {
  const ok = { path: '/x', family: 'f', status: 200, title: 'T', description: '', canonical: 'c', robots: '', h1: 'H', json_ld: 1, forms: 0, text: ['Hello there'] }
  assert.deepEqual(compareRow(ok, ok).failed, [])
  assert.deepEqual(compareRow(ok, { ...ok, text: [], text_unread: true }).failed, ['text', 'readable'])
})

test('compare: where a line breaks is layout, not content', () => {
  assert.equal(textCoverage(['Visit Official WebsiteEnroll Now'], ['Visit Official Website', 'Enroll Now']), 1)
  assert.equal(textCoverage(['Visit Official Website', 'Enroll Now'], ['Visit Official WebsiteEnroll Now']), 1)
  assert.equal(textCoverage(['Read article'], ['Read more']), 0)
})

test('compare: an <h1> the migrated page adds for the same visible heading is kept; a different one is not', () => {
  const before = { path: '/t', family: 'f', status: 200, title: 'T', description: '', canonical: 'c', robots: '', h1: '', json_ld: 1, forms: 0, text: ['Adobe XD', 'UI/UX design and prototyping.'] }
  assert.deepEqual(compareRow(before, { ...before, h1: 'Adobe XD' }).failed, [])
  assert.deepEqual(compareRow(before, { ...before, h1: 'Something else' }).failed, ['h1'])
})

test('compare: a short name (3 letters, below the text line minimum) is matched to the page title', () => {
  const before = { path: '/tools/ga4', family: 'f', status: 200, title: 'GA4 | Acadvizen', description: '', canonical: 'c', robots: '', h1: '', json_ld: 1, forms: 0, text: ['Google Analytics 4 reporting.'] }
  assert.deepEqual(compareRow(before, { ...before, h1: 'GA4' }).failed, [])
})
