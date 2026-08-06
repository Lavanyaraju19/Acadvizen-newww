const { test, expect } = require('@playwright/test')
const { createClient } = require('@supabase/supabase-js')
const {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  E2E_BASE_URL,
  createScopedCmsValue,
  destructiveCmsTestConfig,
  loginAdmin,
} = require('./utils')

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)
const hasSupabaseAdminEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

function createSupabaseAdminClient() {
  if (!hasSupabaseAdminEnv) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for destructive CMS verification.')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function browserApiFetch(page, url, options = {}) {
  const result = await page.evaluate(async ({ targetUrl, requestOptions }) => {
    const headers = new Headers(requestOptions.headers || {})
    let body = requestOptions.body

    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      body = JSON.stringify(body)
    }

    const response = await fetch(targetUrl, {
      method: requestOptions.method || 'GET',
      headers,
      body,
      cache: 'no-store',
    })

    const text = await response.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }

    return {
      ok: response.ok,
      status: response.status,
      text,
      json,
    }
  }, {
    targetUrl: url,
    requestOptions: options,
  })

  if (!result.ok || result.json?.success === false) {
    throw new Error(result.json?.error || `Request to ${url} failed with status ${result.status}.`)
  }

  return result.json
}

async function findBlogBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load blog ${slug}: ${error.message}`)
  }

  return data || null
}

async function deleteBlogById(supabase, id) {
  if (!id) return
  const { error } = await supabase.from('blogs').delete().eq('id', id)
  if (error) {
    throw new Error(`Failed to delete blog ${id}: ${error.message}`)
  }
}

// Plain HTTP fetch, not page.goto() + DOM query: this is used exclusively to read /sitemap.xml,
// raw XML rather than a rendered page. Navigating a real browser to an XML response hands it to
// that browser's built-in XML viewer, whose DOM shape (and whether/how fast `body` innerText()
// resolves) differs per engine - Firefox's XML viewer in particular left
// `locator('body').innerText()` hanging until the 30s test timeout. A direct fetch reads the
// same bytes without depending on any browser's XML-rendering quirks.
async function readPublicBody(_browser, path) {
  const response = await fetch(new URL(path, E2E_BASE_URL).toString(), { cache: 'no-store' })
  return await response.text()
}

async function fetchPublicResponse(path) {
  const response = await fetch(new URL(path, process.env.E2E_BASE_URL || 'http://127.0.0.1:3200'), { redirect: 'manual' })
  return {
    status: response.status,
    body: await response.text(),
  }
}

test.describe('CMS Blog CRUD', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required for CMS blog CRUD tests')
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for CMS blog CRUD tests')
  let createdBlogId = ''

  test.afterAll(async () => {
    const supabase = createSupabaseAdminClient()
    if (createdBlogId) {
      await deleteBlogById(supabase, createdBlogId)
      createdBlogId = ''
    }
  })

  test('creates a draft blog, keeps it private, publishes it live, updates it, then unpublishes and cleans it up', async ({ browser }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')

    const supabase = createSupabaseAdminClient()
    const safetyConfig = destructiveCmsTestConfig
    expect(['staging', 'disposable']).toContain(safetyConfig.environment)
    if (safetyConfig.environment === 'disposable') {
      expect(safetyConfig.isDisposableLocal).toBe(true)
    }

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const publicContext = await browser.newContext()
    const publicPage = await publicContext.newPage()

    const baseSlug = createScopedCmsValue('blog')
    const initialTitle = `${baseSlug} title`
    const updatedTitle = `${baseSlug} updated`
    const draftPayload = {
      title: initialTitle,
      slug: baseSlug,
      description: `${baseSlug} draft description`,
      content: `${baseSlug} draft content`,
      status: 'draft',
      auto_generate_blocks: true,
      tags: ['e2e'],
      categories: ['testing'],
    }

    try {
      await loginAdmin(adminPage)
      await adminPage.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })

      const createResponse = await browserApiFetch(adminPage, '/api/cms/blogs', {
        method: 'POST',
        body: draftPayload,
      })

      createdBlogId = createResponse?.data?.id || ''
      expect(createdBlogId).toBeTruthy()

      const createdBlog = await findBlogBySlug(supabase, baseSlug)
      expect(createdBlog?.id).toBe(createdBlogId)
      expect(createdBlog?.status).toBe('draft')

      await publicPage.goto('/blog', { waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByText(initialTitle)).toHaveCount(0)

      await publicPage.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByRole('heading', { level: 3, name: initialTitle })).toHaveCount(0)

      const draftPublicResponse = await fetchPublicResponse(`/blog/${baseSlug}`)
      expect([200, 404]).toContain(draftPublicResponse.status)
      expect(draftPublicResponse.body).toMatch(/Blog not found\.|Page not found/)
      expect(draftPublicResponse.body).not.toContain(initialTitle)

      expect(await readPublicBody(browser, '/sitemap.xml')).not.toContain(`/blog/${baseSlug}`)

      await browserApiFetch(adminPage, `/api/cms/blogs/${createdBlogId}`, {
        method: 'PATCH',
        body: {
          status: 'published',
        },
      })

      await expect.poll(async () => {
        const blog = await findBlogBySlug(supabase, baseSlug)
        return blog?.status || ''
      }, { timeout: 15000 }).toBe('published')

      await publicPage.goto(`/blog/${baseSlug}`, { waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByRole('heading', { name: initialTitle })).toBeVisible()

      await expect.poll(async () => {
        await publicPage.goto('/blog', { waitUntil: 'domcontentloaded' })
        return await publicPage.getByText(initialTitle).count()
      }, { timeout: 15000 }).toBeGreaterThan(0)

      // The homepage's "From the Blog" section hydrates its post list client-side, on a
      // deferred requestIdleCallback/setTimeout (see loadBlogPosts in
      // src/legacy/pages/HomePage.jsx) - navigate once and poll the already-loaded page's
      // DOM in place. Re-navigating on every poll tick (as the /blog checks above do) would
      // reset the page before that deferred fetch ever gets a chance to resolve, since
      // domcontentloaded fires well before the idle-callback fires.
      await publicPage.goto('/', { waitUntil: 'domcontentloaded' })
      await expect.poll(async () => {
        return await publicPage.getByRole('heading', { level: 3, name: initialTitle }).count()
      }, { timeout: 15000 }).toBe(1)

      await expect.poll(async () => {
        return await readPublicBody(browser, '/sitemap.xml')
      }, { timeout: 15000 }).toContain(`/blog/${baseSlug}`)

      await browserApiFetch(adminPage, `/api/cms/blogs/${createdBlogId}`, {
        method: 'PATCH',
        body: {
          title: updatedTitle,
          description: `${baseSlug} updated description`,
          content: `${baseSlug} updated content`,
        },
      })

      await expect.poll(async () => {
        await publicPage.goto(`/blog/${baseSlug}`, { waitUntil: 'domcontentloaded' })
        return await publicPage.getByRole('heading', { name: updatedTitle }).count()
      }, { timeout: 15000 }).toBeGreaterThan(0)

      await browserApiFetch(adminPage, `/api/cms/blogs/${createdBlogId}`, {
        method: 'PATCH',
        body: {
          status: 'draft',
        },
      })

      await expect.poll(async () => {
        const blog = await findBlogBySlug(supabase, baseSlug)
        return blog?.status || ''
      }, { timeout: 15000 }).toBe('draft')

      await publicPage.goto('/blog', { waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByText(updatedTitle)).toHaveCount(0)

      await publicPage.goto('/', { waitUntil: 'domcontentloaded' })
      await expect.poll(async () => {
        return await publicPage.getByRole('heading', { level: 3, name: updatedTitle }).count()
      }, { timeout: 15000 }).toBe(0)

      const unpublishedPublicResponse = await fetchPublicResponse(`/blog/${baseSlug}`)
      expect([200, 404]).toContain(unpublishedPublicResponse.status)
      expect(unpublishedPublicResponse.body).toMatch(/Blog not found\.|Page not found/)
      expect(unpublishedPublicResponse.body).not.toContain(updatedTitle)

      await expect.poll(async () => {
        return await readPublicBody(browser, '/sitemap.xml')
      }, { timeout: 15000 }).not.toContain(`/blog/${baseSlug}`)

      await browserApiFetch(adminPage, `/api/cms/blogs/${createdBlogId}`, {
        method: 'DELETE',
      })

      await expect.poll(async () => {
        const blog = await findBlogBySlug(supabase, baseSlug)
        return blog ? 'present' : 'deleted'
      }, { timeout: 15000 }).toBe('deleted')

      createdBlogId = ''
    } finally {
      await publicContext.close()
      await adminContext.close()
    }
  })
})
