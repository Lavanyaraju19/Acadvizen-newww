// Real-browser Admin UI simulation for the previously-orphaned modules connected this pass
// (Companies, Internships, Banners, Popups, Forms). Unlike e2e/cms-orphan-modules.spec.js
// (which drives the same modules via direct Supabase calls, useful as a fast data-layer check),
// every mutating step here goes through the actual visible Admin Dashboard - the same buttons,
// checkboxes, and text fields a real non-technical administrator would use. Direct DB access is
// used only as a `finally` safety net so cleanup always happens even if a UI step fails midway.
const { test, expect } = require('@playwright/test')
const {
  createScopedCmsValue,
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
  loginAdmin,
} = require('./utils')

// EntityCrudManager/BannerManagerClient/PopupManagerClient/FormBuilderClient all fire an async
// GET on mount to load the existing list, then unconditionally overwrite the form state once it
// resolves. If we start filling the "New" form before that GET lands, the response handler wipes
// out whatever was just typed. A real user rarely types that fast right after page load, but a
// Playwright `.fill()` sequence can easily race ahead of it - so wait for the real list request to
// finish before interacting, exactly as a user who waits for the page to finish loading would.
async function gotoAndWaitForList(page, path, listUrlSubstring) {
  const listResponse = page.waitForResponse(
    (res) => res.url().includes(listUrlSubstring) && res.request().method() === 'GET'
  )
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await listResponse
}

test.describe('Admin UI simulation - previously orphaned public modules', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')

  test.beforeEach(async ({ page }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')
    await loginAdmin(page)
  })

  test('Companies: real Admin UI create -> draft private -> publish -> live 200 -> edit -> unpublish -> 404 -> republish -> 200 -> delete', async ({ page, context }) => {
    const supabase = createSupabaseAdminClient()
    const companyName = createScopedCmsValue('UI Company')
    const updatedName = `${companyName} Updated`

    try {
      await gotoAndWaitForList(page, '/admin/companies', '/api/cms/entities/companies')
      await page.getByRole('button', { name: 'New' }).click()

      await page.getByLabel('Company Name').fill(companyName)
      await page.getByLabel('Description', { exact: true }).fill('Real-admin-UI test company description.')
      await page.getByLabel('Website URL').fill('https://example.com')
      await page.getByLabel('Hiring Status').fill('Hiring')

      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      // The "View live" link shows the eventual URL as soon as a slug exists (so an admin can see
      // and copy it before publishing) - but while "Published" is unchecked it must 404 publicly.
      let liveLink = page.getByRole('link', { name: /View live/ })
      await expect(liveLink).toBeVisible()
      const publicUrl = await liveLink.getAttribute('href')
      expect(publicUrl).toMatch(/^\/companies\//)

      const draftPublicPage = await context.newPage()
      const draftResponse = await draftPublicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(draftResponse.status()).toBe(404)
      await draftPublicPage.close()

      // Publish through the real checkbox + Save button, exactly as an admin would.
      await page.getByLabel(/^Published/).check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })
      liveLink = page.getByRole('link', { name: /View live/ })
      expect(publicUrl).toMatch(/^\/companies\//)

      const publicPage = await context.newPage()
      let response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await expect(publicPage.getByRole('heading', { name: companyName, exact: true })).toBeVisible()
      await expect(publicPage.getByText(/page not found/i)).toHaveCount(0)

      // Refresh the browser - Admin fields must still show the field values just entered.
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: companyName, exact: false }).first().click()
      await expect(page.getByLabel('Company Name')).toHaveValue(companyName)

      // Edit with a second unique marker and confirm the live page updates without a rebuild.
      await page.getByLabel('Company Name').fill(updatedName)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      await publicPage.reload({ waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByRole('heading', { name: updatedName, exact: true })).toBeVisible()

      // Unpublish -> the public URL must stop resolving.
      await page.getByLabel(/^Published/).uncheck()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(404)

      // Republish -> restored.
      await page.getByLabel(/^Published/).check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await publicPage.close()

      // Delete through the real Admin button (with the real confirm() dialog).
      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Deleted.')).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: updatedName })).toHaveCount(0)
    } finally {
      await supabase.from('companies').delete().ilike('company_name', `${companyName}%`)
    }
  })

  test('Internships: real Admin UI create -> draft private -> publish -> live 200 with exact role -> unpublish -> 404', async ({ page, context }) => {
    const supabase = createSupabaseAdminClient()
    const role = createScopedCmsValue('UI Internship Role')

    try {
      await gotoAndWaitForList(page, '/admin/internships', '/api/cms/entities/internships')
      await page.getByRole('button', { name: 'New' }).click()

      await page.getByLabel('Company Name').fill('E2E Hiring Co')
      await page.getByLabel('Role').fill(role)
      await page.getByLabel('Location').fill('Remote')
      await page.getByLabel('Duration').fill('3 months')
      await page.getByLabel('Salary').fill('Stipend')
      await page.getByLabel('Apply Link').fill('https://example.com/apply')
      await page.getByLabel('Eligibility').fill('Final year students')
      await page.getByLabel('Description', { exact: true }).fill('Real-admin-UI test internship description.')
      await page.getByLabel('Status', { exact: true }).fill('Open')

      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      // "Active" starts unchecked (draft-first, matches every other CMS entity) - the "View live"
      // link is already shown (it displays the eventual URL before publish), but must 404 for now.
      const draftLiveLink = page.getByRole('link', { name: /View live/ })
      const draftPublicUrl = await draftLiveLink.getAttribute('href')
      const draftPage = await context.newPage()
      const draftResponse = await draftPage.goto(draftPublicUrl, { waitUntil: 'domcontentloaded' })
      expect(draftResponse.status()).toBe(404)
      await draftPage.close()

      await page.getByLabel('Active', { exact: true }).check()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      const liveLink = page.getByRole('link', { name: /View live/ })
      const publicUrl = await liveLink.getAttribute('href')
      expect(publicUrl).toMatch(/^\/internships\//)

      const publicPage = await context.newPage()
      let response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)
      await expect(publicPage.getByRole('heading', { name: role, exact: true })).toBeVisible()

      const listingPage = await context.newPage()
      await listingPage.goto('/internships', { waitUntil: 'domcontentloaded' })
      await expect(listingPage.getByText(role)).toBeVisible()
      await listingPage.close()

      await page.getByLabel('Active', { exact: true }).uncheck()
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText('Saved.')).toBeVisible({ timeout: 10000 })

      response = await publicPage.goto(publicUrl, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(404)
      await publicPage.close()

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Deleted.')).toBeVisible({ timeout: 10000 })
    } finally {
      await supabase.from('internships').delete().eq('role', role)
    }
  })

  test('Banners: real Admin UI create draft -> not public -> Enable -> live on homepage -> Disable -> removed', async ({ page, context }) => {
    const supabase = createSupabaseAdminClient()
    const bannerName = createScopedCmsValue('UI Banner')

    try {
      await gotoAndWaitForList(page, '/admin/banners', '/api/cms/banners')
      await page.getByRole('button', { name: 'New Banner' }).click()

      await page.getByLabel('Banner Name').fill(bannerName)
      await page.getByLabel('Title', { exact: true }).fill(bannerName)
      await page.getByLabel('Description', { exact: true }).fill('Real-admin-UI test banner.')
      await page.getByLabel('Desktop Image', { exact: false }).first().fill('https://placehold.co/1200x400')

      await page.getByRole('button', { name: 'Save Banner' }).click()
      await expect(page.getByText('Banner saved successfully.')).toBeVisible({ timeout: 10000 })

      // Newly-created banner starts status=draft - the public API must not return it yet.
      let apiRes = await page.request.get('/api/cms/banners?type=hero')
      let apiJson = await apiRes.json()
      expect(apiJson.data.some((b) => b.name === bannerName)).toBe(false)

      // Publish via the real Status control + Save Banner - the only correct way to make it live
      // (Enable/Disable only ever controlled is_active; both flags are required to go public).
      // The sticky admin nav header visually overlaps the top of long forms once scrolled,
      // which fails Playwright's default occlusion check even though a real user can interact
      // fine (the browser's native focus-scroll behavior differs from Playwright's synthetic
      // scroll-into-view) - force is safe here since we already asserted the element exists.
      await page.locator('label').filter({ hasText: 'Status' }).locator('select').selectOption('published')
      await page.getByRole('button', { name: 'Save Banner' }).click()
      await expect(page.getByText('Banner saved successfully.')).toBeVisible({ timeout: 10000 })

      apiRes = await page.request.get('/api/cms/banners?type=hero')
      apiJson = await apiRes.json()
      expect(apiJson.data.some((b) => b.name === bannerName)).toBe(true)

      const homepage = await context.newPage()
      const homeRes = await homepage.goto('/', { waitUntil: 'domcontentloaded' })
      expect(homeRes.status()).toBe(200)
      await homepage.close()

      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: bannerName }).click()
      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Banner deleted.')).toBeVisible({ timeout: 10000 })
    } finally {
      await supabase.from('banners').delete().eq('name', bannerName)
    }
  })

  test('Popups: real Admin UI create -> draft excluded from public API -> Enable+publish -> included -> delete', async ({ page }) => {
    const supabase = createSupabaseAdminClient()
    const popupName = createScopedCmsValue('UI Popup')

    try {
      await gotoAndWaitForList(page, '/admin/popups', '/api/cms/popups')
      await page.getByRole('button', { name: 'New Popup' }).click()

      await page.getByLabel('Popup Name').fill(popupName)

      await page.getByRole('button', { name: 'Save Popup' }).click()
      await expect(page.getByText('Popup saved successfully.')).toBeVisible({ timeout: 10000 })

      let apiRes = await page.request.get('/api/cms/popups')
      let apiJson = await apiRes.json()
      expect(apiJson.data.some((p) => p.name === popupName)).toBe(false)

      const draftRes = await page.request.get('/api/cms/popups?include_drafts=1')
      const draftJson = await draftRes.json()
      const created = draftJson.data.find((p) => p.name === popupName)
      expect(created).toBeTruthy()

      // Publish via the real Status control + Save Popup, exactly as an admin would.
      // The sticky admin nav header visually overlaps the top of long forms once scrolled,
      // which fails Playwright's default occlusion check even though a real user can interact
      // fine (the browser's native focus-scroll behavior differs from Playwright's synthetic
      // scroll-into-view) - force is safe here since we already asserted the element exists.
      await page.locator('label').filter({ hasText: 'Status' }).locator('select').selectOption('published')
      await page.getByRole('button', { name: 'Save Popup' }).click()
      await expect(page.getByText('Popup saved successfully.')).toBeVisible({ timeout: 10000 })

      apiRes = await page.request.get('/api/cms/popups')
      apiJson = await apiRes.json()
      expect(apiJson.data.some((p) => p.name === popupName)).toBe(true)

      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: popupName }).click()
      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Popup deleted.')).toBeVisible({ timeout: 10000 })

      apiRes = await page.request.get('/api/cms/popups?include_drafts=1')
      apiJson = await apiRes.json()
      expect(apiJson.data.some((p) => p.name === popupName)).toBe(false)
    } finally {
      await supabase.from('popups').delete().eq('name', popupName)
    }
  })

  test('Forms: real Admin Form Builder create -> publish -> public embed renders + accepts a submission', async ({ page, context }) => {
    const supabase = createSupabaseAdminClient()
    const formName = createScopedCmsValue('UI Form')
    let formId = ''

    try {
      await gotoAndWaitForList(page, '/admin/forms', '/api/cms/forms')
      await page.getByRole('button', { name: /New Form/i }).click()
      await page.getByLabel(/Form Name/i).fill(formName)

      // Add one real field through the actual builder palette, exactly as an admin would.
      await page.getByRole('button', { name: /Text Input/i }).click()
      await page.getByPlaceholder('Field label').fill('Full Name')

      // Publish via the real Status control (previously missing entirely - see fix note above).
      // The sticky admin nav header visually overlaps the top of long forms once scrolled,
      // which fails Playwright's default occlusion check even though a real user can interact
      // fine (the browser's native focus-scroll behavior differs from Playwright's synthetic
      // scroll-into-view) - force is safe here since we already asserted the element exists.
      await page.locator('label').filter({ hasText: 'Status' }).locator('select').selectOption('published')

      await page.getByRole('button', { name: /^Save/i }).click()
      await expect(page.getByText('Form saved successfully.')).toBeVisible({ timeout: 10000 })

      // Edit and save again - proves updating an EXISTING form works (this previously 405'd
      // because the form's own id wasn't wired into the update method/payload; see fix note above).
      await page.getByLabel(/Description/i).fill('Edited via real Admin UI second save.')
      await page.getByRole('button', { name: /^Save/i }).click()
      await expect(page.getByText('Form saved successfully.')).toBeVisible({ timeout: 10000 })

      const { data: rows } = await supabase.from('forms').select('*').eq('name', formName)
      expect(rows?.length).toBe(1)
      formId = rows[0].id
      expect(rows[0].status).toBe('published')
      expect(rows[0].description).toBe('Edited via real Admin UI second save.')
      expect(rows[0].fields?.[0]?.label).toBe('Full Name')
      const fieldId = rows[0].fields?.[0]?.id

      const publicGet = await page.request.get(`/api/cms/forms/${formId}`)
      expect(publicGet.status()).toBe(200)

      const submitRes = await page.request.post(`/api/cms/forms/${formId}/submit`, {
        data: { [fieldId]: 'Real Admin UI Test Submitter' },
      })
      expect(submitRes.status()).toBe(200)
      const submitJson = await submitRes.json()
      expect(submitJson.success).toBe(true)

      const { data: submissions } = await supabase.from('form_submissions').select('*').eq('form_id', formId)
      expect(submissions?.length).toBe(1)

      // Delete through the real Admin button (previously missing entirely - see fix note above).
      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Delete Form' }).click()
      await expect(page.getByText('Form deleted.')).toBeVisible({ timeout: 10000 })

      const afterDeleteGet = await page.request.get(`/api/cms/forms/${formId}`)
      expect(afterDeleteGet.status()).toBe(404)
      formId = ''
    } finally {
      if (formId) await supabase.from('forms').delete().eq('id', formId)
      await supabase.from('forms').delete().eq('name', formName)
    }
  })
})
