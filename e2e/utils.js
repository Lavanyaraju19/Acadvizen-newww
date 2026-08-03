const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')
const { expect } = require('@playwright/test')
const { createClient } = require('@supabase/supabase-js')
const {
  DEFAULT_BASE_URL,
  assertDestructiveCmsTestsAllowed,
  createScopedCmsValue,
  getDestructiveCmsBlockMessage,
  getDestructiveCmsTestConfig,
} = require('./safety')

// Loading order matters: the server that Playwright drives reads .env.local as its
// authoritative source (Next.js loads .env.local ahead of .env.test.local/.env for every
// NODE_ENV except 'test'). To ensure the E2E runner submits the SAME credentials and
// Supabase project the server validates, load .env.local first (first-file-wins with
// override:false). .env.local must point at a disposable/staging Supabase project - see
// e2e/safety.js's KNOWN_PRODUCTION_PROJECT_REFS hard block for the confirmed-production ref.
for (const envFile of ['.env.local', '.env.test.local', '.env']) {
  const envPath = path.join(__dirname, '..', envFile)
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false, quiet: true })
  }
}

const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD
const E2E_BASE_URL = process.env.E2E_BASE_URL || DEFAULT_BASE_URL
const destructiveCmsTestConfig = getDestructiveCmsTestConfig()
const hasSupabaseAdminEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

function getMissingCredentialMessage() {
  return (
      'E2E credentials are missing. Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in environment variables ' +
      'or in .env.test.local/.env.local before running Playwright.\n' +
      'Example placeholders:\n' +
      '  E2E_BASE_URL=http://127.0.0.1:3200\n' +
      '  E2E_ADMIN_EMAIL=test-admin@example.com\n' +
      '  E2E_ADMIN_PASSWORD=replace-with-test-admin-password'
  )
}

function assertE2ECredentials() {
  if (!E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD) {
    throw new Error(getMissingCredentialMessage())
  }
}

async function waitForAdminShell(page, { timeout = 20000 } = {}) {
  const logoutButton = page.getByRole('button', { name: /logout/i })
  const adminError = page.locator('text=Admin Access Error, text=Unable to open the admin dashboard')
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
    if (page.url().includes('/admin-login')) {
      throw new Error('Login failed - redirected back to /admin-login before the admin shell became ready')
    }

    if (await adminError.count() > 0) {
      throw new Error('Login failed - admin access error after login')
    }

    if (await logoutButton.isVisible().catch(() => false)) {
      return
    }

    await page.waitForTimeout(250)
  }

  throw new Error('Admin shell did not become ready before timeout.')
}

async function loginAdmin(page) {
  assertE2ECredentials()
  await page.context().clearCookies()
  await page.goto('/admin-login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  const currentUrl = page.url()
  if (currentUrl.includes('/admin') && !currentUrl.includes('login')) {
    const errorElement = page.locator('text=Admin Access Error, text=Unable to open the admin dashboard')
    if (await errorElement.count() > 0) {
      await page.goto('/admin-login', { waitUntil: 'domcontentloaded' })
    } else {
      return
    }
  }

  // Exercise the exact browser flow a real administrator uses:
  // 1. Render /admin-login and wait for React hydration (interactive fields + enabled submit).
  await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible({ timeout: 20000 })
  await page.waitForFunction(() => {
    const emailField = document.querySelector('#admin-email')
    const passwordField = document.querySelector('#admin-password')
    const submitButton = document.querySelector('button[type="submit"]')
    if (!(emailField instanceof HTMLElement) || !(passwordField instanceof HTMLElement) || !(submitButton instanceof HTMLButtonElement)) {
      return false
    }

    const emailRect = emailField.getBoundingClientRect()
    const passwordRect = passwordField.getBoundingClientRect()
    return (
      emailRect.width > 0 &&
      emailRect.height > 0 &&
      passwordRect.width > 0 &&
      passwordRect.height > 0 &&
      !submitButton.disabled &&
      !document.body.innerText.includes('Loading...')
    )
  }, { timeout: 20000 })

  // 2. Capture the login and session-sync responses BEFORE submitting.
  const loginResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/admin/login') && response.request().method() === 'POST',
    { timeout: 20000 }
  )
  const sessionSyncPromise = page.waitForResponse(
    (response) => response.url().includes('/api/admin/session') && response.request().method() === 'POST'
  ).catch(() => null)

  // 3. Fill the controlled React inputs and click the real submit button.
  await page.fill('#admin-email', E2E_ADMIN_EMAIL)
  await page.fill('#admin-password', E2E_ADMIN_PASSWORD)
  await page.click('button[type="submit"]')

  // 4. Assert the login mutation succeeded.
  const loginResponse = await loginResponsePromise
  const loginPayload = await loginResponse.json().catch(() => null)
  if (!loginResponse.ok() || loginPayload?.success === false) {
    throw new Error(loginPayload?.error || `Login failed with status ${loginResponse.status()}.`)
  }

  // 5. Let the optional session sync settle (it re-sets the admin cookie server-side).
  await sessionSyncPromise

  // 6. Wait for the client-side navigation to /admin and the admin shell to mount.
  await page.waitForURL(/\/admin($|\/)/, { timeout: 20000 })
  await waitForAdminShell(page)
}

async function checkAndHandleSessionError(page) {
  const errorElement = page.locator('text=Admin Access Error, text=Unable to open the admin dashboard')
  if (await errorElement.count() > 0) {
    const retryButton = page.locator('button:has-text("Retry")')
    if (await retryButton.count() > 0) {
      await retryButton.first().click()
      await page.waitForLoadState('domcontentloaded')
    } else {
      await loginAdmin(page)
    }

    const errorAfterRetry = page.locator('text=Admin Access Error, text=Unable to open the admin dashboard')
    if (await errorAfterRetry.count() > 0) {
      await loginAdmin(page)
    }
  }
}

async function waitForSuccessMessage(page) {
  await page.waitForTimeout(2000)
  const successMessage = page.locator('p').filter({ hasText: /Saved|Deleted|Created|Duplicated|uploaded|saved|deleted|success/i })
  if (await successMessage.count() > 0) {
    await successMessage.first().waitFor({ state: 'visible', timeout: 5000 })
  }
}

async function fillForm(page, fields) {
  for (const [key, value] of Object.entries(fields)) {
    const selector = `input[name="${key}"], textarea[name="${key}"], select[name="${key}"]`
    const element = page.locator(selector).first()

    if (typeof value === 'boolean') {
      const checkbox = page.locator(`input[type="checkbox"][name="${key}"]`).first()
      const isChecked = await checkbox.isChecked()
      if (isChecked !== value) {
        await checkbox.check()
      }
    } else if (await element.isVisible()) {
      await element.fill(String(value))
    }
  }
}

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

async function readPublicBody(browser, targetPath) {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    const response = await page.goto(targetPath, { waitUntil: 'domcontentloaded' })
    return {
      status: response?.status?.() || 0,
      body: await page.locator('body').innerText(),
    }
  } finally {
    await context.close()
  }
}

async function verifyRecordExists(page, recordSelector) {
  await expect(page.locator(recordSelector)).toBeVisible()
}

async function verifyRecordNotExists(page, recordSelector) {
  await expect(page.locator(recordSelector)).not.toBeVisible()
}

module.exports = {
  E2E_BASE_URL,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
  assertE2ECredentials,
  assertDestructiveCmsTestsAllowed,
  browserApiFetch,
  createSupabaseAdminClient,
  createScopedCmsValue,
  getDestructiveCmsBlockMessage,
  getMissingCredentialMessage,
  loginAdmin,
  readPublicBody,
  waitForAdminShell,
  checkAndHandleSessionError,
  waitForSuccessMessage,
  fillForm,
  verifyRecordExists,
  verifyRecordNotExists,
}
