import test from 'node:test'
import assert from 'node:assert/strict'
import { STATIC_ROUTES, REDIRECTED_PATHS, indexableRows, withoutRedirected } from '../../lib/publicSitemapRoutes.js'

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

test('rows marked noindex, or with a noindex SEO override, are left out of the sitemap', () => {
  const rows = [{ slug: 'kept' }, { slug: 'own-flag', noindex: true }, { slug: 'override' }, { slug: 'flag-false', noindex: false }, null]
  assert.deepEqual(indexableRows(rows, new Set(['override'])).map((r) => r.slug), ['kept', 'flag-false'])
  assert.deepEqual(indexableRows(undefined), [])
})

test('the sitemap builder applies the noindex rules to pages, page SEO overrides and blogs', async () => {
  const fs = await import('node:fs')
  const source = fs.readFileSync(new URL('../../lib/publicSitemap.js', import.meta.url), 'utf8')
  assert.match(source, /fetchSlugRows\(supabase, 'pages', \{[^}]*\}\], respectNoindex: true \}\)/)
  assert.match(source, /indexableRows\(pages, noindexSeoSlugs\)/)
  assert.match(source, /indexableRows\(await fetchPublishedPublicBlogs\(\{ select: '[^']*noindex'/)
})

test('an author page without published posts is noindex and left out of the sitemap', async () => {
  const fs = await import('node:fs')
  const sitemap = fs.readFileSync(new URL('../../lib/publicSitemap.js', import.meta.url), 'utf8')
  assert.match(sitemap, /from\('blogs'\)\.select\('author_id'\)\.eq\('status', 'published'\)/)
  assert.match(sitemap, /if \(!row\.slug \|\| !authorsWithPosts\.has\(row\.id\)\) continue/)
  const page = fs.readFileSync(new URL('../../app/(public)/blog/author/[slug]/page.jsx', import.meta.url), 'utf8')
  assert.match(page, /\.select\('id', \{ count: 'exact', head: true \}\)\s*\.eq\('status', 'published'\)\s*\.eq\('author_id', author\.id\)/)
  assert.match(page, /noindex: !count,/)
})
