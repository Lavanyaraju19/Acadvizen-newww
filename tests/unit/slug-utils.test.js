import test from 'node:test'
import assert from 'node:assert/strict'

import { generateSlug, validateSlug, generateCanonicalUrl } from '../../lib/slugUtils.js'

test('generateSlug normalizes mixed text into a clean URL slug', () => {
  assert.equal(generateSlug('  Hello, World! 2026  '), 'hello-world-2026')
  assert.equal(generateSlug('SEO   Course --- Bangalore'), 'seo-course-bangalore')
  assert.equal(generateSlug("Beginner's SEO Course"), 'beginners-seo-course')
  assert.equal(generateSlug('Café Marketing Course'), 'cafe-marketing-course')
  assert.equal(generateSlug('Test/Page\\Name'), 'test-page-name')
})

test('validateSlug rejects malformed slugs and accepts valid ones', () => {
  assert.deepEqual(validateSlug('ab'), {
    valid: false,
    error: 'Slug must be at least 3 characters',
  })
  assert.deepEqual(validateSlug('bad slug'), {
    valid: false,
    error: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  assert.deepEqual(validateSlug('admin'), {
    valid: false,
    error: 'Slug conflicts with a reserved application route',
  })
  assert.deepEqual(validateSlug('../escape'), {
    valid: false,
    error: 'Slug cannot contain slashes',
  })
  assert.deepEqual(validateSlug('valid-slug-2026'), { valid: true })
})

test('generateCanonicalUrl avoids double slashes when given a prefixed slug', () => {
  assert.equal(
    generateCanonicalUrl('https://acadvizen.com', '/digital-marketing-course-in-bangalore'),
    'https://acadvizen.com/digital-marketing-course-in-bangalore'
  )
})
