import test from 'node:test'
import assert from 'node:assert/strict'

import {
  assertSlugAvailable,
  buildPublishFields,
  fetchPublishedRecordBySlug,
  getCanonicalPath,
  getCmsCacheTargets,
  getCmsRouteMap,
  normalizeCmsSlug,
  normalizeCmsStatus,
  resolveCmsPublicRoute,
  resolvePublicCmsRecordBySlug,
  validateCmsSlug,
} from '../../lib/cmsPublishing.js'

function createSlugLookupSupabase({ existing = null, error = null } = {}) {
  const chain = {
    select() { return this },
    eq() { return this },
    limit() { return this },
    neq() { return this },
    async maybeSingle() {
      return { data: existing, error }
    },
  }
  return {
    from() {
      return chain
    },
  }
}

test('normalizeCmsSlug trims slashes, lowercases, and removes unsafe characters', () => {
  assert.equal(normalizeCmsSlug(' /New CMS Page!! 2026/ '), 'new-cms-page-2026')
  assert.equal(normalizeCmsSlug('Digital   Marketing---Course'), 'digital-marketing-course')
  assert.equal(normalizeCmsSlug('Bad/Path\\Value'), 'bad-path-value')
})

test('validateCmsSlug rejects empty and reserved slugs after normalization', () => {
  assert.deepEqual(validateCmsSlug(' //// '), {
    valid: false,
    error: 'Slug is required',
    slug: '',
  })
  assert.deepEqual(validateCmsSlug('/admin/'), {
    valid: false,
    error: 'Slug conflicts with a reserved application route',
    slug: 'admin',
  })
  assert.deepEqual(validateCmsSlug(' Valid Page '), { valid: true, slug: 'valid-page' })
})

test('canonical public paths match route namespaces', () => {
  assert.equal(getCanonicalPath('page', 'About'), '/about')
  assert.equal(getCanonicalPath('blog', 'My Blog'), '/blog/my-blog')
  assert.equal(getCanonicalPath('blog_category', 'Career Tips'), '/blog/category/career-tips')
  assert.equal(getCanonicalPath('blog_tag', 'SEO'), '/blog/tag/seo')
  assert.equal(getCanonicalPath('author', 'Acadvizen Team'), '/blog/author/acadvizen-team')
  assert.equal(getCanonicalPath('course', 'Advanced'), '/courses/advanced')
  assert.equal(getCanonicalPath('tool', 'Canva'), '/tools/canva')
  assert.equal(getCanonicalPath('city_page', 'Bangalore'), '/digital-marketing-course-in-bangalore')
  assert.equal(getCanonicalPath('location_page', 'digital-marketing-courses-jayanagar'), '/digital-marketing-courses-jayanagar')
})

test('resolveCmsPublicRoute supports custom overrides and legacy location patterns safely', () => {
  assert.equal(resolveCmsPublicRoute({ contentType: 'page', slug: 'ignored', customUrl: '/Custom Landing/' }), '/custom-landing')
  assert.equal(resolveCmsPublicRoute({ contentType: 'page', slug: 'fallback', customUrl: '/admin/hidden' }), '/fallback')
  assert.equal(resolveCmsPublicRoute({ contentType: 'location_course', location: 'Indiranagar' }), '/digital-marketing-courses-indiranagar')
  assert.equal(resolveCmsPublicRoute({ contentType: 'city_course', city: 'Bangalore' }), '/digital-marketing-course-bangalore')
  assert.equal(resolveCmsPublicRoute({ contentType: 'service_location', parentSlug: 'seo-course', area: 'Jayanagar' }), '/seo-course-in-jayanagar')
  assert.equal(resolveCmsPublicRoute({ contentType: 'blog', slug: 'post' }), '/blog/post')
})

test('route map separates public standalone and assigned-content modules', () => {
  const routeMap = getCmsRouteMap()
  const page = routeMap.find((item) => item.contentType === 'page')
  const blog = routeMap.find((item) => item.contentType === 'blog')
  const reusableSection = routeMap.find((item) => item.contentType === 'reusable_section')
  assert.equal(page?.routePattern, '/{slug}')
  assert.equal(blog?.routePattern, '/blog/{slug}')
  assert.equal(reusableSection?.publicStandalone, false)
})

test('publish fields preserve existing timestamps and clear them for drafts', () => {
  assert.deepEqual(buildPublishFields({ nextStatus: 'live', existing: { published_at: '2026-01-01T00:00:00.000Z' } }), {
    status: 'published',
    published_at: '2026-01-01T00:00:00.000Z',
  })
  assert.deepEqual(buildPublishFields({ nextStatus: 'archived' }), {
    status: 'archived',
    published_at: null,
  })
  assert.equal(normalizeCmsStatus('pending-review'), 'review')
})

test('cache targets include detail, previous slug, listing, sitemap, and tags', () => {
  const targets = getCmsCacheTargets('blog', {
    slug: 'new-post',
    previousSlug: 'old-post',
  })
  assert.ok(targets.paths.includes('/blog'))
  assert.ok(targets.paths.includes('/blog/new-post'))
  assert.ok(targets.paths.includes('/blog/old-post'))
  assert.ok(targets.paths.includes('/sitemap.xml'))
  assert.ok(targets.tags.includes('cms:blogs'))
  assert.ok(targets.tags.includes('cms:blogs:new-post'))
})

test('assertSlugAvailable rejects duplicate normalized slugs', async () => {
  await assert.rejects(
    () => assertSlugAvailable(createSlugLookupSupabase({ existing: { id: 'other' } }), {
      table: 'pages',
      slug: 'Duplicate Slug',
      contentType: 'page',
    }),
    /already exists/
  )
})

test('assertSlugAvailable returns the normalized slug when available', async () => {
  const slug = await assertSlugAvailable(createSlugLookupSupabase(), {
    table: 'pages',
    slug: ' Available Slug ',
    contentType: 'page',
  })
  assert.equal(slug, 'available-slug')
})

test('resolvePublicCmsRecordBySlug falls back to alternate CMS tables when the first lookup misses', async () => {
  let attempt = 0
  const supabase = {
    from(table) {
      attempt += 1
      const result = table === 'pages'
        ? { data: null, error: null }
        : { data: [{ id: 'location-1', slug: 'fallback-location', status: 'published' }], error: null }

      return {
        select() { return this },
        eq() { return this },
        limit() { return this },
        is() { return this },
        or() { return this },
        then(resolve) { resolve(result) },
      }
    },
  }

  const match = await resolvePublicCmsRecordBySlug(supabase, {
    slug: 'Fallback Location',
    requestedRoute: '/fallback-location',
    contentTypes: ['page', 'location_page'],
  })

  assert.equal(match?.contentType, 'location_page')
  assert.equal(match?.record?.slug, 'fallback-location')
})

test('fetchPublishedRecordBySlug falls back to a simpler query when the initial public lookup fails', async () => {
  let attempt = 0
  const supabase = {
    from() {
      attempt += 1
      const result = attempt === 1
        ? { data: null, error: new Error('invalid public query') }
        : { data: [{ id: 'page-1', slug: 'fallback-page', status: 'published' }], error: null }

      return {
        select() { return this },
        eq() { return this },
        limit() { return this },
        is() { return this },
        or() { return this },
        then(resolve) { resolve(result) },
      }
    },
  }

  const record = await fetchPublishedRecordBySlug(supabase, {
    table: 'pages',
    slug: 'Fallback Page',
    contentType: 'page',
    requestedRoute: '/fallback-page',
  })

  assert.equal(record?.slug, 'fallback-page')
  assert.equal(record?.status, 'published')
})
