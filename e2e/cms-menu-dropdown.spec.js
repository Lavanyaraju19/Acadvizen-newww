const { test, expect } = require('@playwright/test')
const {
  createSupabaseAdminClient,
  createScopedCmsValue,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
  loginAdmin,
} = require('./utils')

const hasE2ECredentials = Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD)

async function browserApiFetch(page, url, options = {}) {
  const result = await page.evaluate(async ({ targetUrl, requestOptions }) => {
    const headers = new Headers(requestOptions.headers || {})
    let body = requestOptions.body
    if (body && typeof body === 'object') {
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
      body = JSON.stringify(body)
    }
    const response = await fetch(targetUrl, { method: requestOptions.method || 'GET', headers, body, cache: 'no-store' })
    const text = await response.text()
    let json = null
    try { json = text ? JSON.parse(text) : null } catch { json = null }
    return { ok: response.ok, status: response.status, json }
  }, { targetUrl: url, requestOptions: options })

  return result
}

test.describe('CMS generic dropdown menus', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required.')
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')

  let supabase
  const createdIds = []
  const parentTitle = createScopedCmsValue('dropdown-parent')
  const publishedChildTitle = createScopedCmsValue('dropdown-child-published')
  const draftChildTitle = createScopedCmsValue('dropdown-child-draft')

  test.beforeAll(async () => {
    supabase = createSupabaseAdminClient()
  })

  test.afterAll(async () => {
    if (createdIds.length) {
      await supabase.from('menus').delete().in('id', createdIds)
    }
  })

  test('admin can build a dropdown (parent + published child + draft child) via the real API, and validation rejects cycles', async ({ page }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')

    await loginAdmin(page)

    const parentResult = await browserApiFetch(page, '/api/cms/menus', {
      method: 'POST',
      body: { title: parentTitle, url: '/courses', menu_location: 'header', status: 'published' },
    })
    expect(parentResult.ok, JSON.stringify(parentResult)).toBe(true)
    const parentId = parentResult.json.data.id
    createdIds.push(parentId)

    const publishedChildResult = await browserApiFetch(page, '/api/cms/menus', {
      method: 'POST',
      body: {
        title: publishedChildTitle,
        url: '/courses/seo-course',
        menu_location: 'header',
        parent_id: parentId,
        status: 'published',
        icon: '🎯',
        description: 'A short description for this dropdown item',
      },
    })
    expect(publishedChildResult.ok, JSON.stringify(publishedChildResult)).toBe(true)
    createdIds.push(publishedChildResult.json.data.id)

    const draftChildResult = await browserApiFetch(page, '/api/cms/menus', {
      method: 'POST',
      body: { title: draftChildTitle, url: '/courses/draft-course', menu_location: 'header', parent_id: parentId, status: 'draft' },
    })
    expect(draftChildResult.ok, JSON.stringify(draftChildResult)).toBe(true)
    const draftChildId = draftChildResult.json.data.id
    createdIds.push(draftChildId)

    // A menu item cannot be its own parent.
    const selfParentResult = await browserApiFetch(page, `/api/cms/menus/${parentId}`, {
      method: 'PATCH',
      body: { parent_id: parentId },
    })
    expect(selfParentResult.status).toBe(400)

    // A 2-cycle (parent's parent set to its own child) must be rejected.
    const cycleResult = await browserApiFetch(page, `/api/cms/menus/${parentId}`, {
      method: 'PATCH',
      body: { parent_id: draftChildId },
    })
    expect(cycleResult.status).toBe(400)

    // Public (unauthenticated) list must include the published child but never the draft one.
    const publicListResult = await browserApiFetch(page, `/api/cms/menus?location=header`)
    expect(publicListResult.ok).toBe(true)
    const publicTitles = publicListResult.json.data.map((item) => item.title)
    expect(publicTitles).toContain(parentTitle)
    expect(publicTitles).toContain(publishedChildTitle)
    expect(publicTitles).not.toContain(draftChildTitle)
  })

  test('the published dropdown renders on the public homepage with a dark background, and the draft child never appears', async ({ page }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')
    test.skip(!createdIds.length, 'Depends on the previous test creating the menu items.')

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const parentButton = page.getByRole('button', { name: new RegExp(parentTitle) })
    await expect(parentButton).toBeVisible({ timeout: 20000 })

    // Closed by default - the child link should not be in an open/visible dropdown yet.
    const childLink = page.getByRole('menuitem', { name: new RegExp(publishedChildTitle) })
    await expect(childLink).toHaveCount(0)

    await parentButton.hover()
    await expect(childLink).toBeVisible({ timeout: 5000 })

    const panel = page.locator('[role="menu"]', { has: childLink })
    const backgroundColor = await panel.evaluate((el) => getComputedStyle(el).backgroundColor)
    // bg-slate-950 - must not be a white/near-white background.
    const [r, g, b] = backgroundColor.match(/\d+/g).map(Number)
    expect(r, `dropdown background should be dark, got rgb(${r},${g},${b})`).toBeLessThan(60)
    expect(g).toBeLessThan(60)
    expect(b).toBeLessThan(80)

    // The draft child must never render publicly, open or not.
    await expect(page.getByRole('menuitem', { name: new RegExp(draftChildTitle) })).toHaveCount(0)

    // Escape closes the dropdown.
    await page.keyboard.press('Escape')
    await expect(childLink).toHaveCount(0)
  })

  test('the mobile menu renders the same dropdown as an expandable accordion', async ({ page }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')
    test.skip(!createdIds.length, 'Depends on the first test creating the menu items.')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await page.getByRole('button', { name: /menu/i }).click()
    const childLink = page.getByRole('link', { name: new RegExp(publishedChildTitle) })
    await expect(childLink).toHaveCount(0)

    const expandButton = page.getByRole('button', { name: new RegExp(`Expand ${parentTitle}`) })
    await expect(expandButton).toBeVisible({ timeout: 10000 })
    await expandButton.click()
    await expect(childLink).toBeVisible({ timeout: 5000 })

    await childLink.click()
    // Selecting a destination closes the mobile menu panel.
    await expect(page.getByRole('button', { name: /close/i })).toHaveCount(0)
  })

  test('publishing creates a restore point, and restoring brings back a deleted item', async ({ page }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')
    test.skip(!createdIds.length, 'Depends on the first test creating the menu items.')

    await loginAdmin(page)

    const versionResult = await browserApiFetch(page, '/api/cms/menus/versions', {
      method: 'POST',
      body: { menu_location: 'header', label: 'e2e-test-checkpoint' },
    })
    expect(versionResult.ok, JSON.stringify(versionResult)).toBe(true)
    const versionId = versionResult.json.data.id

    const publishedChildId = createdIds[1]
    const deleteResult = await browserApiFetch(page, `/api/cms/menus/${publishedChildId}`, { method: 'DELETE' })
    expect(deleteResult.ok).toBe(true)

    const afterDeleteResult = await browserApiFetch(page, `/api/cms/menus?location=header&include_inactive=1&limit=500`)
    expect(afterDeleteResult.json.data.map((item) => item.id)).not.toContain(publishedChildId)

    const restoreResult = await browserApiFetch(page, `/api/cms/menus/versions/${versionId}/restore`, { method: 'POST' })
    expect(restoreResult.ok, JSON.stringify(restoreResult)).toBe(true)

    const afterRestoreResult = await browserApiFetch(page, `/api/cms/menus?location=header&include_inactive=1&limit=500`)
    const restoredTitles = afterRestoreResult.json.data.map((item) => item.title)
    expect(restoredTitles).toContain(publishedChildTitle)

    // Restore inserted a new row (a fresh id) for the deleted item - track it for cleanup too.
    const restoredChild = afterRestoreResult.json.data.find((item) => item.title === publishedChildTitle)
    if (restoredChild && !createdIds.includes(restoredChild.id)) {
      createdIds.push(restoredChild.id)
    }
  })
})
