import test from 'node:test'
import assert from 'node:assert/strict'
import { STATIC_ROUTES } from '../../lib/publicSitemapRoutes.js'

test('the sitemap does not list addresses that permanently redirect', () => {
  const paths = STATIC_ROUTES.map((route) => route.path)
  // Both redirect (308) to the city pages /digital-marketing-courses-bangalore and -jayanagar.
  for (const redirected of ['/digital-marketing-course-in-bangalore', '/digital-marketing-course-in-jayanagar']) {
    assert.equal(paths.includes(redirected), false, `${redirected} redirects and must not be in the sitemap`)
  }
  assert.equal(paths.includes('/about'), true)
  assert.equal(new Set(paths).size, paths.length, 'no route listed twice')
})
