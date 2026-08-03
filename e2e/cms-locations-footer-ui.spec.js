// Real-browser Admin UI simulation for Cities (existing module, not previously proven via a real
// browser click-through) and Locations/Areas (the new module built this pass specifically because
// the public footer's "Digital Marketing Courses in India" link list had a real, working public
// reader but literally no Admin path to create an entry - see lib/publicWidgets.js sibling notes
// in the Companies/Internships spec for the equivalent pattern used there).
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

test.describe('Admin UI simulation - Cities and Locations/Footer', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')

  test.beforeEach(async ({ page }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')
    await loginAdmin(page)
  })

  test('Cities: real Admin UI create -> draft private -> publish -> live at canonical URL -> edit -> unpublish -> 404 -> republish -> delete', async ({ page, context }) => {
    const supabase = createSupabaseAdminClient()
    const cityName = createScopedCmsValue('UI City').replace(/-/g, ' ')
    const updatedTitle = `${cityName} Updated Hero`

    try {
      await gotoAndWaitForList(page, '/admin/cities', '/api/cms/cities')
      await page.getByRole('button', { name: 'Add City' }).click()

      await page.getByLabel('City Name').fill(cityName)
      await page.getByLabel('Hero Title').fill(cityName)

      await page.getByRole('button', { name: 'Save City Page' }).click()
      await expect(page.getByText('City page saved successfully.')).toBeVisible({ timeout: 10000 })

      const liveLink = page.getByRole('link', { name: /View live/ })
      const publicUrl = await liveLink.getAttribute('href')
      expect(publicUrl).toMatch(/^\/digital-marketing-course-in-/)

      // Draft (Enable not yet clicked) must not be publicly reachable.
      const publicPage = await context.newPage()
      let response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(404)

      // Publish through the real Enable toggle, exactly as an admin would.
      await page.getByRole('button', { name: 'Enable' }).click()
      await expect(page.getByText('City page enabled.')).toBeVisible({ timeout: 10000 })

      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await expect(publicPage.getByRole('heading', { name: cityName, exact: true })).toBeVisible()

      // Edit with a second unique marker and confirm the live page updates immediately.
      await page.getByLabel('Hero Title').fill(updatedTitle)
      await page.getByRole('button', { name: 'Save City Page' }).click()
      await expect(page.getByText('City page saved successfully.')).toBeVisible({ timeout: 10000 })

      await publicPage.reload({ waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByRole('heading', { name: updatedTitle, exact: true })).toBeVisible()

      // Unpublish -> public URL must 404.
      await page.getByRole('button', { name: 'Disable' }).click()
      await expect(page.getByText('City page disabled.')).toBeVisible({ timeout: 10000 })
      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(404)

      // Republish -> restored.
      await page.getByRole('button', { name: 'Enable' }).click()
      await expect(page.getByText('City page enabled.')).toBeVisible({ timeout: 10000 })
      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await publicPage.close()

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('City page deleted.')).toBeVisible({ timeout: 10000 })
    } finally {
      await supabase.from('city_pages').delete().eq('city_name', cityName)
    }
  })

  test('Locations/Areas: real Admin UI create -> not in footer while draft -> publish -> appears in footer -> click -> live page -> edit -> unpublish -> removed from footer -> republish -> restored -> delete', async ({ page, context }) => {
    const supabase = createSupabaseAdminClient()
    const areaName = createScopedCmsValue('UI Area').replace(/-/g, ' ')
    const updatedIntro = 'Updated intro text via real Admin UI second save.'

    try {
      await gotoAndWaitForList(page, '/admin/locations', '/api/cms/entities/locations')
      await page.getByRole('button', { name: 'New' }).click()

      await page.getByLabel('Area / Location Name').fill(areaName)
      await page.getByLabel('SEO Title').fill(areaName)
      await page.getByLabel('Intro Text').fill('Original intro text for this area.')

      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      const liveLink = page.getByRole('link', { name: /View live/ })
      const publicUrl = await liveLink.getAttribute('href')
      expect(publicUrl).toMatch(/^\/digital-marketing-courses-/)

      // Draft: the location's own page always renders a generic fallback for any slug (a
      // deliberate broad programmatic-SEO design predating this pass), but it must NOT be in
      // the public footer's location list, and must not show our custom intro text yet.
      const homepage = await context.newPage()
      await homepage.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(homepage.getByRole('link', { name: areaName })).toHaveCount(0)

      const draftDetail = await context.newPage()
      await draftDetail.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      await expect(draftDetail.getByText('Original intro text for this area.')).toHaveCount(0)
      await draftDetail.close()

      // Publish via the real checkbox + Save, exactly as an admin would.
      await page.getByLabel(/^Published/).check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      await homepage.reload({ waitUntil: 'domcontentloaded' })
      const footerLink = homepage.getByRole('link', { name: areaName })
      await expect(footerLink).toBeVisible()
      const footerHref = await footerLink.getAttribute('href')
      expect(footerHref).toBe(publicUrl)

      await footerLink.click()
      await homepage.waitForLoadState('domcontentloaded')
      expect(homepage.url()).toContain(publicUrl)
      await expect(homepage.getByText('Original intro text for this area.')).toBeVisible()

      // Edit and confirm the live page updates immediately.
      await page.getByLabel('Intro Text').fill(updatedIntro)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      await homepage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      await expect(homepage.getByText(updatedIntro)).toBeVisible()

      // Unpublish -> removed from footer and from the detail page's custom content.
      await page.getByLabel(/^Published/).uncheck()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      await homepage.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(homepage.getByRole('link', { name: areaName })).toHaveCount(0)
      await homepage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      await expect(homepage.getByText(updatedIntro)).toHaveCount(0)

      // Republish -> restored in both places.
      await page.getByLabel(/^Published/).check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      await homepage.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(homepage.getByRole('link', { name: areaName })).toBeVisible()
      await homepage.close()

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Deleted.')).toBeVisible({ timeout: 10000 })
    } finally {
      await supabase.from('locations').delete().eq('name', areaName)
    }
  })
})
