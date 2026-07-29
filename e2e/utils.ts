import { Page, expect } from '@playwright/test'

export const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || ''
export const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || ''
export const E2E_BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3200'
export const E2E_ALLOW_DESTRUCTIVE_CMS_TESTS =
  process.env.E2E_ALLOW_DESTRUCTIVE_CMS_TESTS?.trim().toLowerCase() === 'true'
export const E2E_TEST_PREFIX = process.env.E2E_TEST_PREFIX?.trim().toLowerCase() || ''

export function isValidDestructiveTestPrefix(value: string) {
  return /^e2e-[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value.trim())
}

export function getDestructiveCmsBlockMessage() {
  const reasons: string[] = []
  const missing: string[] = []

  if (!E2E_ALLOW_DESTRUCTIVE_CMS_TESTS) {
    missing.push('E2E_ALLOW_DESTRUCTIVE_CMS_TESTS')
    reasons.push('Set E2E_ALLOW_DESTRUCTIVE_CMS_TESTS=true to confirm the database is staging or disposable.')
  }

  if (!E2E_TEST_PREFIX) {
    missing.push('E2E_TEST_PREFIX')
    reasons.push('Set E2E_TEST_PREFIX to a safe unique prefix such as e2e-acadvizen.')
  } else if (!isValidDestructiveTestPrefix(E2E_TEST_PREFIX)) {
    reasons.push('E2E_TEST_PREFIX must start with "e2e-" and contain only lowercase letters, numbers, and hyphens.')
  }

  try {
    const parsed = new URL(E2E_BASE_URL)
    if (/(^|\.)acadvizen\.com$/i.test(parsed.hostname)) {
      reasons.push(`Destructive CMS tests are blocked against production host ${parsed.hostname}.`)
    }
  } catch {
    reasons.push('E2E_BASE_URL must be a valid absolute URL before destructive CMS tests can run.')
  }

  const missingLine = missing.length
    ? `Missing variables: ${missing.join(', ')}.`
    : 'All required destructive-test variables are present, but the target is still not considered safe.'

  return [
    'Destructive CMS E2E tests are blocked.',
    missingLine,
    ...reasons,
    'Use a staging or disposable Supabase project only.',
  ].join(' ')
}

export function assertDestructiveCmsTestsAllowed() {
  if (!E2E_ALLOW_DESTRUCTIVE_CMS_TESTS || !E2E_TEST_PREFIX || !isValidDestructiveTestPrefix(E2E_TEST_PREFIX)) {
    throw new Error(getDestructiveCmsBlockMessage())
  }
}

export function createScopedCmsValue(label = 'record') {
  assertDestructiveCmsTestsAllowed()
  const safeLabel = String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'record'

  return `${E2E_TEST_PREFIX}-${safeLabel}-${Date.now()}`
}

export function getMissingCredentialMessage() {
  return (
    'E2E credentials are missing. Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in environment variables ' +
    'or in .env.test.local/.env.local before running Playwright.'
  )
}

export function assertE2ECredentials() {
  if (!E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD) {
    throw new Error(getMissingCredentialMessage())
  }
}

export async function loginAdmin(page: Page) {
  assertE2ECredentials()
  await page.goto('/admin-login')
  await page.waitForLoadState('networkidle')

  const currentUrl = page.url()
  if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
    return
  }

  await page.fill('input[type="email"], input[name="email"]', E2E_ADMIN_EMAIL)
  await page.fill('input[type="password"], input[name="password"]', E2E_ADMIN_PASSWORD)
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")')

  await page.waitForURL(/\/admin($|\/)/)
  await page.waitForLoadState('networkidle')
}

export async function waitForSuccessMessage(page: Page) {
  await page.waitForSelector('p:has-text("Saved"), p:has-text("Deleted"), p:has-text("Created")', { timeout: 10000 })
}

export async function fillForm(page: Page, fields: Record<string, string | boolean>) {
  for (const [key, value] of Object.entries(fields)) {
    const selector = `input[name="${key}"], textarea[name="${key}"], select[name="${key}"]`
    const element = await page.locator(selector).first()

    if (typeof value === 'boolean') {
      const checkbox = await page.locator(`input[type="checkbox"][name="${key}"]`).first()
      const isChecked = await checkbox.isChecked()
      if (isChecked !== value) {
        await checkbox.check()
      }
    } else if (await element.isVisible()) {
      await element.fill(String(value))
    }
  }
}

export async function createRecord(page: Page, entityName: string, fields: Record<string, string | boolean>) {
  await page.goto(`/admin/${entityName}`)
  await page.waitForLoadState('networkidle')
  await page.click('button:has-text("New")')
  await page.waitForTimeout(500)
  await fillForm(page, fields)
  await page.click('button[type="submit"]:has-text("Save")')
  await waitForSuccessMessage(page)
}

export async function editRecord(page: Page, entityName: string, recordSelector: string, fields: Record<string, string | boolean>) {
  await page.goto(`/admin/${entityName}`)
  await page.waitForLoadState('networkidle')
  await page.click(recordSelector)
  await page.waitForTimeout(500)
  await fillForm(page, fields)
  await page.click('button[type="submit"]:has-text("Save")')
  await waitForSuccessMessage(page)
}

export async function deleteRecord(page: Page, entityName: string, recordSelector: string) {
  await page.goto(`/admin/${entityName}`)
  await page.waitForLoadState('networkidle')
  await page.click(recordSelector)
  await page.waitForTimeout(500)
  page.on('dialog', dialog => dialog.accept())
  await page.click('button:has-text("Delete")')
  await waitForSuccessMessage(page)
}

export async function verifyRecordExists(page: Page, recordSelector: string) {
  await expect(page.locator(recordSelector)).toBeVisible()
}

export async function verifyRecordNotExists(page: Page, recordSelector: string) {
  await expect(page.locator(recordSelector)).not.toBeVisible()
}

export async function uploadFile(page: Page, fileInputSelector: string, filePath: string) {
  const fileInput = page.locator(fileInputSelector)
  await fileInput.setInputFiles(filePath)
}

export function generateTestId(prefix: string) {
  return `${prefix}-${Date.now()}`
}
