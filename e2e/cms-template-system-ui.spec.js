// Verifies the universal CMS template system: (1) the two brand-new content types built for
// it (Resource Pages, Service Pages) work end-to-end through the real Admin UI exactly like
// every other module, and (2) previously light-themed renderers (City, Location) now render
// through the shared dark-themed template primitives (PageHero/Breadcrumbs/PageCTA) instead of
// a one-off design that didn't match the rest of the site.
const { test, expect } = require('@playwright/test')
const {
  createScopedCmsValue,
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
  loginAdmin,
} = require('./utils')

async function gotoAndWaitForList(page, path, listUrlSubstring) {
  const listResponse = page.waitForResponse(
    (res) => res.url().includes(listUrlSubstring) && res.request().method() === 'GET'
  )
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await listResponse
}

test.describe('Admin UI simulation - Universal template system', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')

  test.beforeEach(async ({ page }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')
    await loginAdmin(page)
  })

  test('Resource Pages: real Admin UI create -> draft 404s -> publish -> live with shared template -> edit -> unpublish -> 404 -> republish -> delete', async ({ page, context }) => {
    const supabase = createSupabaseAdminClient()
    const title = createScopedCmsValue('UI Resource').replace(/-/g, ' ')
    const updatedDescription = 'Updated resource description via real Admin UI second save.'

    try {
      await gotoAndWaitForList(page, '/admin/resources', '/api/cms/entities/resources')
      await page.getByRole('button', { name: 'New' }).click()

      await page.getByLabel('Title', { exact: true }).fill(title)
      await page.getByLabel(/Description/).first().fill('Original resource description.')
      await page.getByLabel(/Page Content/).fill('Full page body content for this resource.')

      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      const liveLink = page.getByRole('link', { name: /View live/ })
      const publicUrl = await liveLink.getAttribute('href')
      expect(publicUrl).toMatch(/^\/resources\//)

      const publicPage = await context.newPage()
      let response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(404)

      await page.getByLabel('Published').check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await expect(publicPage.getByRole('heading', { name: title })).toBeVisible()
      // Shared template primitives: breadcrumb trail present automatically (admin never coded it).
      await expect(publicPage.locator('nav[aria-label="Breadcrumb"]')).toBeVisible()
      await expect(publicPage.getByText('Full page body content for this resource.')).toBeVisible()

      await page.getByLabel(/Description/).first().fill(updatedDescription)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      await publicPage.reload({ waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByText(updatedDescription)).toBeVisible()

      await page.getByLabel('Published').uncheck()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })
      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(404)

      await page.getByLabel('Published').check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })
      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await publicPage.close()

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Deleted.')).toBeVisible({ timeout: 10000 })
    } finally {
      await supabase.from('resources').delete().eq('title', title)
    }
  })

  test('Service Pages: real Admin UI create -> draft 404s -> publish -> live with shared template (hero/curriculum/FAQ) -> edit -> unpublish -> 404 -> republish -> delete', async ({ page, context }) => {
    const supabase = createSupabaseAdminClient()
    const title = createScopedCmsValue('UI Service Course').replace(/-/g, ' ')
    const updatedOverview = 'Updated overview text via real Admin UI second save.'

    try {
      await gotoAndWaitForList(page, '/admin/service-pages', '/api/cms/entities/service_pages')
      await page.getByRole('button', { name: 'New' }).click()

      await page.getByLabel(/^Page Title/).fill(title)
      await page.getByLabel(/Overview/).fill('Original overview text.')
      await page.getByLabel(/Curriculum/).fill('["Module 1: Fundamentals", "Module 2: Live Projects"]')
      await page.getByLabel(/FAQs/).fill('[{"question":"Is this beginner friendly?","answer":"Yes, no prior experience required."}]')

      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      const liveLink = page.getByRole('link', { name: /View live/ })
      const publicUrl = await liveLink.getAttribute('href')
      expect(publicUrl).toMatch(/^\//)

      const publicPage = await context.newPage()
      let response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(404)

      await page.getByLabel('Published').check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await expect(publicPage.getByText(title, { exact: false }).first()).toBeVisible()
      await expect(publicPage.locator('nav[aria-label="Breadcrumb"]')).toBeVisible()
      await expect(publicPage.getByText('Module 1: Fundamentals')).toBeVisible()
      await expect(publicPage.getByText('Is this beginner friendly?')).toBeVisible()

      await page.getByLabel(/Overview/).fill(updatedOverview)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      await publicPage.reload({ waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByText(updatedOverview)).toBeVisible()

      await page.getByLabel('Published').uncheck()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })
      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(404)

      await page.getByLabel('Published').check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })
      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await publicPage.close()

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Deleted.')).toBeVisible({ timeout: 10000 })
    } finally {
      await supabase.from('service_pages').delete().eq('title', title)
    }
  })

  test('City and Location pages render through the shared dark-themed template (breadcrumbs + CTA), not the old light theme', async ({ page }) => {
    const supabase = createSupabaseAdminClient()
    const cityName = createScopedCmsValue('Template City').replace(/-/g, ' ')
    const citySlug = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const areaName = createScopedCmsValue('Template Area').replace(/-/g, ' ')
    const areaSlug = areaName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      const { error: cityError } = await supabase.from('city_pages').insert({
        city_name: cityName,
        slug: citySlug,
        hero_title: cityName,
        is_active: true,
      })
      expect(cityError).toBeNull()

      const { error: locationError } = await supabase.from('locations').insert({
        name: areaName,
        slug: areaSlug,
        is_active: true,
      })
      expect(locationError).toBeNull()

      await page.goto(`/digital-marketing-course-in-${citySlug}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: cityName, exact: true })).toBeVisible()
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Explore Courses' }).first()).toBeVisible()

      await page.goto(`/digital-marketing-courses-${areaSlug}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Explore Courses' }).first()).toBeVisible()
    } finally {
      await supabase.from('city_pages').delete().eq('city_name', cityName)
      await supabase.from('locations').delete().eq('name', areaName)
    }
  })
})
