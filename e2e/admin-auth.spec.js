const { test, expect } = require('@playwright/test')
const {
  E2E_BASE_URL,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  loginAdmin,
  waitForAdminShell,
} = require('./utils')

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)

test.describe('Admin Auth', () => {
  test('redirects unauthenticated admin dashboard requests back to the login page', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin-login/)
    await expect(page.locator('main h1').filter({ hasText: 'Admin Login' }).first()).toBeVisible()
  })

  test('renders the admin login form without a false config error when public config is available', async ({ page }) => {
    await page.goto('/admin-login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main h1').filter({ hasText: 'Admin Login' }).first()).toBeVisible()
    await expect(page.locator('#admin-email')).toBeVisible()
    await expect(page.locator('#admin-password')).toBeVisible()
    await expect(page.locator('text=Supabase configuration is unavailable')).toHaveCount(0)
  })

  test('shows a clear configuration error when the public config bootstrap fails', async ({ page }) => {
    let configRequestCount = 0
    await page.route('**/api/public-config', async (route) => {
      configRequestCount += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Supabase public configuration is missing.',
        }),
      })
    })

    await page.goto('/admin-login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main h1').filter({ hasText: 'Admin Login' }).first()).toBeVisible()
    // page.fill() doesn't reliably fire the input events this React-controlled form's onChange
    // depends on in WebKit - see loginAdmin() in utils.js and the "rejects invalid credentials"
    // test below for the same fix.
    await page.locator('#admin-email').pressSequentially('nobody@example.com', { delay: 10 })
    await page.locator('#admin-password').pressSequentially('invalid-password', { delay: 10 })
    await page.click('button[type="submit"], button:has-text("Sign in")')

    await expect(page.locator('text=Supabase configuration is unavailable')).toBeVisible()
    await expect(page.locator('text=SUPABASE_SERVICE_ROLE_KEY')).toHaveCount(0)
    await expect(page.locator('text=service_role')).toHaveCount(0)
    expect(configRequestCount).toBeLessThanOrEqual(3)
  })

  test.describe('credentialed auth flows', () => {
    test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required for credentialed auth flows')
    test.describe.configure({ mode: 'serial' })

    /** @type {import('@playwright/test').Browser | null} */
    let browserRef = null

    test.beforeAll(async ({ browser }) => {
      browserRef = browser
    })

    test.afterAll(async () => {
      browserRef = null
    })

    test('logs in successfully and keeps the session across refresh', async () => {
      const context = await browserRef.newContext({ baseURL: E2E_BASE_URL })
      const page = await context.newPage()
      try {
        await loginAdmin(page)
        await waitForAdminShell(page)
        await expect(page).toHaveURL(/\/admin($|\/)/)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await waitForAdminShell(page)
        await expect(page).toHaveURL(/\/admin($|\/)/)
      } finally {
        await context.close()
      }
    })

    test('logs out cleanly and does not restore the admin session after refresh', async () => {
      const context = await browserRef.newContext({ baseURL: E2E_BASE_URL })
      const page = await context.newPage()
      try {
        await loginAdmin(page)
        await waitForAdminShell(page)
        const logoutButton = page.getByRole('button', { name: /logout/i })
        await expect(logoutButton).toBeVisible({ timeout: 15000 })
        await logoutButton.click()
        await expect(page).toHaveURL(/\/admin-login/)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(page).toHaveURL(/\/admin-login/)
        await expect(page.locator('main h1').filter({ hasText: 'Admin Login' }).first()).toBeVisible()
      } finally {
        await context.close()
      }
    })

    test('rejects invalid credentials without exposing an internal stack trace', async () => {
      const context = await browserRef.newContext({ baseURL: E2E_BASE_URL })
      const page = await context.newPage()
      try {
        await page.goto('/admin-login', { waitUntil: 'domcontentloaded' })
        await page.evaluate(() => {
          window.localStorage.clear()
          window.sessionStorage.clear()
        })
        // page.fill() doesn't reliably fire the input events this React-controlled form's
        // onChange depends on in WebKit - see loginAdmin() in utils.js for the same fix.
        await page.locator('#admin-email').pressSequentially(E2E_ADMIN_EMAIL, { delay: 10 })
        await page.locator('#admin-password').pressSequentially(`${E2E_ADMIN_PASSWORD}-invalid`, { delay: 10 })
        await page.click('button[type="submit"], button:has-text("Sign in")')

        await expect(page).toHaveURL(/\/admin-login/)
        await expect(
          page.getByText(/Invalid email or password|Invalid login credentials|Access denied|Unable to sign in|Too many login attempts/i)
        ).toBeVisible()
        await expect(page.locator('text=Error:')).toHaveCount(0)
        await expect(page.locator('text=stack')).toHaveCount(0)
      } finally {
        await context.close()
      }
    })
  })
})
