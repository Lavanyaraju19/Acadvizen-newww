const { test, expect } = require('@playwright/test')
const {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  E2E_BASE_URL,
  browserApiFetch,
  createScopedCmsValue,
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
  loginAdmin,
} = require('./utils')

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)

function absoluteUrl(pathname = '/') {
  return new URL(pathname, E2E_BASE_URL).toString()
}

async function fetchPublicStatus(pathname) {
  const response = await fetch(absoluteUrl(pathname), { redirect: 'manual' })
  return response.status
}

function isoInFuture(hours = 1) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function isoInPast(hours = 1) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

test.describe('CMS Scheduled Publishing', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required for scheduled publishing tests')
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for scheduled publishing tests')

  let createdPageId = ''
  let createdBlogId = ''

  test.afterAll(async () => {
    const supabase = createSupabaseAdminClient()
    if (createdPageId) {
      await supabase.from('pages').delete().eq('id', createdPageId)
      createdPageId = ''
    }
    if (createdBlogId) {
      await supabase.from('blogs').delete().eq('id', createdBlogId)
      createdBlogId = ''
    }
  })

  test('a page marked published with a future "go live at" time stays hidden, then a past time makes it live', async ({ browser }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const slug = createScopedCmsValue('scheduled-page')

    try {
      await loginAdmin(adminPage)

      const created = await browserApiFetch(adminPage, '/api/cms/pages', {
        method: 'POST',
        body: {
          title: `${slug} title`,
          slug,
          description: `${slug} description`,
          status: 'published',
          scheduled_publish_at: isoInFuture(1),
        },
      })
      createdPageId = created?.data?.id || ''
      expect(createdPageId).toBeTruthy()

      // The publishing contract (isRecordPubliclyVisible in lib/cmsPublishing.js) gates
      // visibility on scheduled_publish_at independently of status - status=published with a
      // future scheduled_publish_at must still 404 publicly.
      expect(await fetchPublicStatus(`/${slug}`)).toBe(404)

      await browserApiFetch(adminPage, `/api/cms/pages/${createdPageId}`, {
        method: 'PATCH',
        body: { scheduled_publish_at: isoInPast(1) },
      })

      await expect.poll(async () => fetchPublicStatus(`/${slug}`), { timeout: 15000 }).toBe(200)
    } finally {
      await adminContext.close()
    }
  })

  test('a published page with a past "take down at" time is hidden immediately', async ({ browser }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const slug = createScopedCmsValue('unpublish-page')

    try {
      await loginAdmin(adminPage)

      const created = await browserApiFetch(adminPage, '/api/cms/pages', {
        method: 'POST',
        body: {
          title: `${slug} title`,
          slug,
          description: `${slug} description`,
          status: 'published',
        },
      })
      const pageId = created?.data?.id || ''
      expect(pageId).toBeTruthy()

      await expect.poll(async () => fetchPublicStatus(`/${slug}`), { timeout: 15000 }).toBe(200)

      await browserApiFetch(adminPage, `/api/cms/pages/${pageId}`, {
        method: 'PATCH',
        body: { scheduled_unpublish_at: isoInPast(1) },
      })

      await expect.poll(async () => fetchPublicStatus(`/${slug}`), { timeout: 15000 }).toBe(404)

      const supabase = createSupabaseAdminClient()
      await supabase.from('pages').delete().eq('id', pageId)
    } finally {
      await adminContext.close()
    }
  })

  test('a blog marked published with a future "go live at" time stays hidden, then a past time makes it live', async ({ browser }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const slug = createScopedCmsValue('scheduled-blog')

    try {
      await loginAdmin(adminPage)

      const created = await browserApiFetch(adminPage, '/api/cms/blogs', {
        method: 'POST',
        body: {
          title: `${slug} title`,
          slug,
          content: `${slug} content`,
          status: 'published',
          scheduled_publish_at: isoInFuture(1),
        },
      })
      createdBlogId = created?.data?.id || ''
      expect(createdBlogId).toBeTruthy()

      expect(await fetchPublicStatus(`/blog/${slug}`)).toBe(404)

      await browserApiFetch(adminPage, `/api/cms/blogs/${createdBlogId}`, {
        method: 'PATCH',
        body: { scheduled_publish_at: isoInPast(1) },
      })

      await expect.poll(async () => fetchPublicStatus(`/blog/${slug}`), { timeout: 15000 }).toBe(200)
    } finally {
      await adminContext.close()
    }
  })
})
