import test from 'node:test'
import assert from 'node:assert/strict'

import { generateSlug, generateSlugLive, validateSlug, generateCanonicalUrl } from '../../lib/slugUtils.js'

test('generateSlug normalizes mixed text into a clean URL slug', () => {
  assert.equal(generateSlug('  Hello, World! 2026  '), 'hello-world-2026')
  assert.equal(generateSlug('SEO   Course --- Bangalore'), 'seo-course-bangalore')
  assert.equal(generateSlug("Beginner's SEO Course"), 'beginners-seo-course')
  assert.equal(generateSlug('Café Marketing Course'), 'cafe-marketing-course')
  assert.equal(generateSlug('Test/Page\\Name'), 'test-page-name')
})

test('generateSlugLive preserves a hyphen typed as the last character (unlike generateSlug)', () => {
  // Regression test: a slug input's onChange re-sanitizes the full value on every keystroke.
  // generateSlug() strips a trailing hyphen, which - when called live like that - means a
  // hyphen typed directly into the field is always "trailing" at that instant and would be
  // eaten immediately, so no hyphen could ever survive being typed by hand.
  assert.equal(generateSlug('dropshipping-'), 'dropshipping')
  assert.equal(generateSlugLive('dropshipping-'), 'dropshipping-')
  // Simulate typing "dropshipping-course-in-bangalore" one character at a time through the live
  // sanitizer, feeding each intermediate value back in exactly as a controlled input would.
  const target = 'dropshipping-course-in-bangalore'
  let typed = ''
  let value = ''
  for (const ch of target) {
    typed += ch
    value = generateSlugLive(typed)
  }
  assert.equal(value, target)
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
