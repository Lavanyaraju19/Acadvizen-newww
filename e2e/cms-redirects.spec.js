const { test, expect } = require('@playwright/test')
const {
  E2E_BASE_URL,
  createScopedCmsValue,
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
} = require('./utils')

function absoluteUrl(pathname = '/') {
  return new URL(pathname, E2E_BASE_URL).toString()
}

async function fetchManual(pathname) {
  return fetch(absoluteUrl(pathname), { redirect: 'manual' })
}

async function createRedirect(supabase, fromPath, toPath, statusCode = 301) {
  const { data, error } = await supabase
    .from('redirects')
    .insert({
      from_path: fromPath,
      to_path: toPath,
      status_code: statusCode,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create redirect ${fromPath} -> ${toPath}: ${error.message}`)
  }

  return data
}

async function deleteRedirect(supabase, id) {
  if (!id) return
  const { error } = await supabase.from('redirects').delete().eq('id', id)
  if (error) {
    throw new Error(`Failed to delete redirect ${id}: ${error.message}`)
  }
}

test.describe('CMS Redirect Pipeline', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for redirect pipeline tests')

  test('returns real HTTP 301 responses for public page, blog, city, course, project, and tool legacy URLs', async () => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')

    const supabase = createSupabaseAdminClient()
    expect(['staging', 'disposable']).toContain(destructiveCmsTestConfig.environment)
    if (destructiveCmsTestConfig.environment === 'staging') {
      expect(destructiveCmsTestConfig.targetProjectRef).toBe(destructiveCmsTestConfig.expectedProjectRef)
    } else {
      expect(destructiveCmsTestConfig.isDisposableLocal).toBe(true)
    }
    const createdRedirectIds = []

    const cases = [
      { label: 'page', fromPath: `/${createScopedCmsValue('redirect-page-old')}`, toPath: '/about' },
      { label: 'blog', fromPath: `/blog/${createScopedCmsValue('redirect-blog-old')}`, toPath: '/blog' },
      { label: 'city', fromPath: `/${createScopedCmsValue('redirect-city-old')}`, toPath: '/digital-marketing-course-in-bangalore' },
      { label: 'course', fromPath: `/courses/${createScopedCmsValue('redirect-course-old')}`, toPath: '/courses/basic' },
      { label: 'project', fromPath: `/${createScopedCmsValue('redirect-project-old')}`, toPath: '/projects' },
      { label: 'tool', fromPath: `/tools/${createScopedCmsValue('redirect-tool-old')}`, toPath: '/tools' },
    ]

    try {
      for (const redirectCase of cases) {
        const redirectRecord = await createRedirect(supabase, redirectCase.fromPath, redirectCase.toPath, 301)
        createdRedirectIds.push(redirectRecord.id)

        const redirectResponse = await fetchManual(`${redirectCase.fromPath}?utm_source=e2e&case=${redirectCase.label}`)
        expect(redirectResponse.status, `${redirectCase.label} old URL should return 301`).toBe(301)
        // The redirect may be served by middleware (absolute Location, required
        // by the edge Response/Headers contract) or by the page-level redirect()
        // call (relative Location). Both are valid - compare the resolved path.
        const locationUrl = new URL(redirectResponse.headers.get('location'), E2E_BASE_URL)
        expect(
          `${locationUrl.pathname}${locationUrl.search}`,
          `${redirectCase.label} old URL should point at the expected public target`
        ).toBe(`${redirectCase.toPath}?utm_source=e2e&case=${redirectCase.label}`)

        const liveResponse = await fetchManual(redirectCase.toPath)
        expect(
          liveResponse.status,
          `${redirectCase.label} redirect target should remain directly accessible without another redirect`
        ).toBe(200)
      }
    } finally {
      while (createdRedirectIds.length) {
        const redirectId = createdRedirectIds.pop()
        await deleteRedirect(supabase, redirectId)
      }
    }
  })
})
