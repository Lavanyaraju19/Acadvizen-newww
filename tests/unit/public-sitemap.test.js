import test from 'node:test'
import assert from 'node:assert/strict'
import { STATIC_ROUTES, REDIRECTED_PATHS, withoutRedirected } from '../../lib/publicSitemapRoutes.js'

test('the fixed sitemap routes do not list addresses that permanently redirect', () => {
  const paths = STATIC_ROUTES.map((route) => route.path)
  for (const redirected of REDIRECTED_PATHS) {
    assert.equal(paths.includes(redirected), false, `${redirected} redirects and must not be in the sitemap`)
  }
  assert.equal(paths.includes('/about'), true)
  assert.equal(new Set(paths).size, paths.length, 'no route listed twice')
})

test('entries from any source (e.g. a published pages row) are dropped when the address redirects', () => {
  const entries = ['/digital-marketing-course-in-bangalore', '/digital-marketing-course-in-jayanagar/', '/digital-marketing-courses-bangalore', '/seo-course-in-bangalore', '/']
    .map((path) => ({ url: `https://www.acadvizen.com${path}` }))
  assert.deepEqual(withoutRedirected(entries).map((e) => new URL(e.url).pathname), ['/digital-marketing-courses-bangalore', '/seo-course-in-bangalore', '/'])
})

test('both redirecting route files really redirect where the comment says', async () => {
  const fs = await import('node:fs')
  for (const [path, target] of [['digital-marketing-course-in-bangalore', '/digital-marketing-courses-bangalore'], ['digital-marketing-course-in-jayanagar', '/digital-marketing-courses-jayanagar']]) {
    const source = fs.readFileSync(new URL(`../../app/(public)/${path}/page.jsx`, import.meta.url), 'utf8')
    assert.match(source, new RegExp(`permanentRedirect\\(['"]${target}['"]\\)`))
  }
})
