import test from 'node:test'
import assert from 'node:assert/strict'
import { FOOTER_FALLBACK_LINKS, HEADER_FALLBACK_LINKS, LEGAL_FALLBACK_LINKS, fallbackMenuLinks } from '../../lib/navigationDefaults.js'

test('menus without rows show the ui_copy lists, else the built-in lists', () => {
  assert.equal(fallbackMenuLinks('header', {}), HEADER_FALLBACK_LINKS)
  assert.equal(fallbackMenuLinks('footer', null), FOOTER_FALLBACK_LINKS)
  assert.equal(fallbackMenuLinks('legal', { legal_fallback_links: [] }), LEGAL_FALLBACK_LINKS)
  assert.deepEqual(fallbackMenuLinks('footer', { footer_fallback_links: [{ title: ' Home ', url: '/' }, { title: 'No url' }, 'junk'] }), [{ title: 'Home', url: '/', target: '_self' }])
  assert.deepEqual(fallbackMenuLinks('nowhere', {}), [])
})

test('the built-in lists are the ones the live site shows today', () => {
  assert.deepEqual(HEADER_FALLBACK_LINKS.map((l) => l.title), ['Courses', 'Placement', 'Achievements', 'Blog', 'Contact'])
  assert.deepEqual(FOOTER_FALLBACK_LINKS.map((l) => l.url), ['/', '/courses', '/about', '/contact', '/register'])
  assert.deepEqual(LEGAL_FALLBACK_LINKS.map((l) => l.url), ['/terms-of-service', '/privacy-policy'])
})
