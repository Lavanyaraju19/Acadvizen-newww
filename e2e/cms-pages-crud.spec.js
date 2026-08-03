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
  readPublicBody,
} = require('./utils')

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)

function absoluteUrl(pathname = '/') {
  return new URL(pathname, E2E_BASE_URL).toString()
}

async function findPageBySlug(supabase, slug) {
  const { data, error } = await supabase.from('pages').select('*').eq('slug', slug).maybeSingle()
  if (error) {
    throw new Error(`Failed to load page ${slug}: ${error.message}`)
  }
  return data || null
}

async function findPageById(supabase, id) {
  const { data, error } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
  if (error) {
    throw new Error(`Failed to load page ${id}: ${error.message}`)
  }
  return data || null
}

async function listSectionsForPage(supabase, pageId) {
  const { data, error } = await supabase.from('sections').select('*').eq('page_id', pageId).order('order_index', { ascending: true })
  if (error) {
    throw new Error(`Failed to load page sections for ${pageId}: ${error.message}`)
  }
  return Array.isArray(data) ? data : []
}

async function fetchRedirectResponse(pathname) {
  return fetch(absoluteUrl(pathname), { redirect: 'manual' })
}

async function fetchPageResponse(pathname) {
  const response = await fetch(absoluteUrl(pathname), { redirect: 'manual' })
  return {
    status: response.status,
    body: await response.text(),
  }
}

async function cleanupRedirects(adminPage, searchTerm) {
  const result = await browserApiFetch(adminPage, `/api/cms/redirects?search=${encodeURIComponent(searchTerm)}&limit=100`)
  const redirects = Array.isArray(result.data) ? result.data : []
  for (const redirect of redirects) {
    await browserApiFetch(adminPage, `/api/cms/redirects/${redirect.id}`, { method: 'DELETE' })
  }
}

function waitForSectionWrite(page, method = 'POST') {
  return page.waitForResponse((response) => (
    response.url().includes('/api/cms/sections') &&
    response.request().method() === method
  ), { timeout: 20000 })
}

test.describe('CMS Pages CRUD', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required for CMS page CRUD tests')
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for CMS page CRUD tests')

  let createdPageId = ''
  let baseSlug = ''
  let latestSlug = ''
  let createdSectionId = ''

  test.afterAll(async ({ browser }) => {
    const supabase = createSupabaseAdminClient()

    if (createdPageId) {
      await supabase.from('sections').delete().eq('page_id', createdPageId)
      await supabase.from('pages').delete().eq('id', createdPageId)
      createdPageId = ''
      createdSectionId = ''
    }

    if (!baseSlug) return

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    try {
      await loginAdmin(adminPage)
      await cleanupRedirects(adminPage, baseSlug)
    } finally {
      await adminContext.close()
    }
  })

  test('creates a page from the admin builder, keeps drafts private, publishes it live, updates it, changes the slug, then unpublishes and cleans it up', async ({ browser }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')

    const supabase = createSupabaseAdminClient()
    expect(['staging', 'disposable']).toContain(destructiveCmsTestConfig.environment)
    if (destructiveCmsTestConfig.environment === 'staging') {
      expect(destructiveCmsTestConfig.targetProjectRef).toBe(destructiveCmsTestConfig.expectedProjectRef)
    } else {
      expect(destructiveCmsTestConfig.isDisposableLocal).toBe(true)
    }

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const publicContext = await browser.newContext()
    const publicPage = await publicContext.newPage()

    const title = `Acadvizen E2E Page ${Date.now()}`
    baseSlug = createScopedCmsValue('page')
    const firstSlug = `${baseSlug}-manual`
    const secondSlug = `${baseSlug}-renamed`
    latestSlug = firstSlug
    const seoTitle = `${title} SEO`
    const seoDescription = `${title} SEO description`
    const initialHeading = `${title} Hero Heading`
    const updatedHeading = `${title} Updated Hero Heading`

    try {
      await loginAdmin(adminPage)
      await adminPage.goto('/admin/pages', { waitUntil: 'domcontentloaded' })
      await expect(adminPage).toHaveURL(/\/admin\/pages/)
      await expect(adminPage.getByText('Visual Page Builder')).toBeVisible({ timeout: 30000 })
      await expect(adminPage.getByText('Syncing current website content...')).toHaveCount(0, { timeout: 30000 })
      await expect(adminPage.getByText('Loading pages...')).toHaveCount(0, { timeout: 30000 })

      await adminPage.getByRole('button', { name: 'New Page' }).click()
      await expect(adminPage.locator('#page_title')).toHaveValue('')
      await adminPage.locator('#page_title').fill(title)
      await expect(adminPage.locator('#page_slug')).toHaveValue(/acadvizen-e2e-page-/i)

      await adminPage.locator('#page_slug').fill(firstSlug)
      await adminPage.locator('#pagebuilder-page-description').fill(`${title} page description`)
      await adminPage.locator('#page_seo_title').fill(seoTitle)
      await adminPage.locator('#page_canonical_url').fill(absoluteUrl(`/${firstSlug}`))
      await adminPage.locator('#pagebuilder-seo-description').fill(seoDescription)

      const draftSavePayload = await browserApiFetch(adminPage, '/api/cms/pages', {
        method: 'POST',
        body: {
          title,
          slug: firstSlug,
          description: `${title} page description`,
          seo_title: seoTitle,
          seo_description: seoDescription,
          canonical_url: absoluteUrl(`/${firstSlug}`),
          status: 'draft',
        },
      })
      createdPageId = draftSavePayload?.data?.id || ''
      expect(createdPageId).toBeTruthy()

      await expect.poll(async () => {
        const page = await findPageById(supabase, createdPageId)
        return page?.status || ''
      }, { timeout: 15000 }).toBe('draft')

      const draftResponse = await fetchPageResponse(`/${firstSlug}`)
      expect(draftResponse.body).toContain('Page not found')
      expect(draftResponse.body).not.toContain(title)
      expect((await readPublicBody(browser, '/sitemap.xml')).body).not.toContain(`/${firstSlug}`)

      const sectionCreatePayload = await browserApiFetch(adminPage, '/api/cms/sections', {
        method: 'POST',
        body: {
          page_id: createdPageId,
          type: 'hero',
          order_index: 0,
          visibility: true,
          content_json: {
            heading: initialHeading,
            text: `${title} public paragraph`,
          },
          style_json: {},
        },
      })
      createdSectionId = sectionCreatePayload?.data?.id || ''
      expect(createdSectionId).toBeTruthy()

      await expect.poll(async () => {
        const sections = await listSectionsForPage(supabase, createdPageId)
        return sections.some((section) => section?.id === createdSectionId)
      }, { timeout: 15000 }).toBe(true)

      await browserApiFetch(adminPage, '/api/cms/pages', {
        method: 'POST',
        body: {
          id: createdPageId,
          title,
          slug: firstSlug,
          description: `${title} page description`,
          seo_title: seoTitle,
          seo_description: seoDescription,
          canonical_url: absoluteUrl(`/${firstSlug}`),
          status: 'published',
        },
      })

      await expect.poll(async () => {
        const page = await findPageById(supabase, createdPageId)
        return page?.status || ''
      }, { timeout: 15000 }).toBe('published')

      await expect.poll(async () => {
        const response = await publicPage.goto(`/${firstSlug}`, { waitUntil: 'domcontentloaded' })
        return response?.status() || 0
      }, { timeout: 15000 }).toBe(200)

      await expect(publicPage.getByRole('heading', { name: initialHeading })).toBeVisible()
      await expect.poll(async () => await publicPage.title(), { timeout: 15000 }).toContain(seoTitle)
      const firstCanonicalHref = await publicPage.locator('link[rel="canonical"]').getAttribute('href')
      expect(firstCanonicalHref).toContain(`/${firstSlug}`)

      const metaDescription = await publicPage.locator('meta[name="description"]').getAttribute('content')
      expect(metaDescription).toContain(seoDescription)

      await expect.poll(async () => {
        return (await readPublicBody(browser, '/sitemap.xml')).body
      }, { timeout: 15000 }).toContain(`/${firstSlug}`)

      await browserApiFetch(adminPage, `/api/cms/sections/${createdSectionId}`, {
        method: 'PATCH',
        body: {
          content_json: {
            heading: updatedHeading,
            text: `${title} public paragraph`,
          },
        },
      })

      await expect.poll(async () => {
        await publicPage.goto(`/${firstSlug}`, { waitUntil: 'domcontentloaded' })
        return await publicPage.getByRole('heading', { name: updatedHeading }).count()
      }, { timeout: 15000 }).toBeGreaterThan(0)

      await browserApiFetch(adminPage, `/api/cms/pages/${createdPageId}`, {
        method: 'PATCH',
        body: {
          slug: secondSlug,
          canonical_url: absoluteUrl(`/${secondSlug}`),
          status: 'published',
        },
      })
      latestSlug = secondSlug

      await expect.poll(async () => {
        const page = await findPageById(supabase, createdPageId)
        return page?.status || ''
      }, { timeout: 15000 }).toBe('published')

      expect(await findPageBySlug(supabase, firstSlug)).toBeNull()

      const redirectListPayload = await browserApiFetch(
        adminPage,
        `/api/cms/redirects?search=${encodeURIComponent(firstSlug)}&limit=20`
      )
      const createdRedirect = Array.isArray(redirectListPayload?.data)
        ? redirectListPayload.data.find((redirect) => redirect?.from_path === `/${firstSlug}`)
        : null
      expect(createdRedirect?.to_path).toBe(`/${secondSlug}`)

      await expect.poll(async () => {
        const response = await publicPage.goto(`/${secondSlug}`, { waitUntil: 'domcontentloaded' })
        return response?.status() || 0
      }, { timeout: 15000 }).toBe(200)

      const redirectResponse = await fetchRedirectResponse(`/${firstSlug}`)
      expect(redirectResponse.status).toBe(301)
      // The redirect may be served either by middleware (which must emit an absolute
      // Location per the edge runtime's Response/Headers contract) or by the page-level
      // redirect() call (relative Location) - both are valid, so compare resolved paths.
      expect(new URL(redirectResponse.headers.get('location'), E2E_BASE_URL).pathname).toBe(`/${secondSlug}`)

      const secondCanonicalHref = await publicPage.locator('link[rel="canonical"]').getAttribute('href')
      expect(secondCanonicalHref).toContain(`/${secondSlug}`)

      await expect.poll(async () => {
        return (await readPublicBody(browser, '/sitemap.xml')).body
      }, { timeout: 15000 }).toContain(`/${secondSlug}`)

      await expect.poll(async () => {
        return (await readPublicBody(browser, '/sitemap.xml')).body
      }, { timeout: 15000 }).not.toContain(`/${firstSlug}`)

      await browserApiFetch(adminPage, `/api/cms/pages/${createdPageId}`, {
        method: 'PATCH',
        body: {
          status: 'draft',
        },
      })

      await expect.poll(async () => {
        const page = await findPageById(supabase, createdPageId)
        return page?.status || ''
      }, { timeout: 15000 }).toBe('draft')

      const unpublishedResponse = await fetchPageResponse(`/${secondSlug}`)
      expect(unpublishedResponse.body).toContain('Page not found')
      expect(unpublishedResponse.body).not.toContain(updatedHeading)

      await expect.poll(async () => {
        return (await readPublicBody(browser, '/sitemap.xml')).body
      }, { timeout: 15000 }).not.toContain(`/${secondSlug}`)

      await browserApiFetch(adminPage, `/api/cms/pages/${createdPageId}`, {
        method: 'DELETE',
      })

      await expect.poll(async () => {
        const page = await findPageById(supabase, createdPageId)
        return page ? 'present' : 'deleted'
      }, { timeout: 15000 }).toBe('deleted')

      createdPageId = ''
      await cleanupRedirects(adminPage, baseSlug)
    } finally {
      await publicContext.close()
      await adminContext.close()
    }
  })
})
