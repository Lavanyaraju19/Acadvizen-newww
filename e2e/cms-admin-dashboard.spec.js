const fs = require('node:fs')
const { test, expect } = require('@playwright/test')
const {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  loginAdmin,
} = require('./utils')

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)

async function attachScreenshot(testInfo, page, name) {
  const path = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path, fullPage: true })
  await testInfo.attach(name, { path, contentType: 'image/png' })
  return path
}

test.describe('Admin dashboard module', () => {
  test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required.')

  test('loads dashboard controls, health scan, notifications, and responsive layouts without console or API errors', async ({ page }, testInfo) => {
    test.setTimeout(180000)

    const consoleErrors = []
    const apiErrors = []
    const cmsResponses = []
    const evidence = {
      steps: [],
      api: {},
      screenshots: {},
      quick_actions: [],
      responsive: {},
    }

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/') && response.status() >= 400) {
        apiErrors.push(`${response.status()} ${response.request().method()} ${url}`)
      }
      if (url.includes('/api/admin/') || url.includes('/api/cms/health/scan') || url.endsWith('/api/health')) {
        let body = null
        try {
          const text = await response.text()
          body = text ? JSON.parse(text) : null
        } catch {
          body = null
        }
        cmsResponses.push({
          status: response.status(),
          method: response.request().method(),
          url,
          body,
        })
      }
    })

    await loginAdmin(page)
    evidence.steps.push('login')

    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    const dashboardTitle = page.locator('h2').filter({ hasText: /^Admin Dashboard$/ })
    await expect(dashboardTitle).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole('heading', { name: 'Website Health' })).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole('heading', { name: 'System Status' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent Notifications' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible()
    evidence.screenshots.desktop = await attachScreenshot(testInfo, page, 'dashboard-desktop')
    evidence.steps.push('dashboard loaded')

    const expectedActions = [
      ['Create Page', '/admin/pages'],
      ['Create Blog', '/admin/blogs'],
      ['Create Course', '/admin/courses'],
      ['Create City Page', '/admin/cities'],
      ['Upload Media', '/admin/media'],
      ['Create Banner', '/admin/banners'],
      ['View Leads', '/admin/leads'],
      ['Preview Website', '/'],
    ]
    for (const [label, href] of expectedActions) {
      const link = page.getByRole('link', { name: label })
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', href)
      evidence.quick_actions.push({ label, href })
    }

    await page.getByTestId('dashboard-notifications-button').click()
    await expect(page.getByRole('heading', { name: 'Recent Notifications' })).toBeVisible()
    evidence.steps.push('notification button')

    const markAllButton = page.getByTestId('dashboard-mark-all-notifications-read')
    if (await markAllButton.isVisible().catch(() => false)) {
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/admin/notifications') && response.request().method() === 'POST',
        { timeout: 30000 }
      )
      await markAllButton.click()
      const response = await responsePromise
      const json = await response.json()
      expect(response.ok(), JSON.stringify(json)).toBe(true)
      expect(json.success, JSON.stringify(json)).toBe(true)
      evidence.api.mark_all_notifications_read = json
      evidence.steps.push('mark all notifications read')
    } else {
      evidence.steps.push('no unread notifications')
    }

    const runScan = page.getByRole('button', { name: /run scan|scanning/i }).first()
    if (await runScan.isVisible().catch(() => false)) {
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/cms/health/scan') && response.request().method() === 'POST',
        { timeout: 30000 }
      )
      await runScan.click()
      const response = await responsePromise
      const json = await response.json()
      expect(response.ok(), JSON.stringify(json)).toBe(true)
      expect(json.success, JSON.stringify(json)).toBe(true)
      evidence.api.health_scan = json
      evidence.steps.push('health scan')
    }

    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(dashboardTitle).toBeVisible()
    evidence.screenshots.tablet = await attachScreenshot(testInfo, page, 'dashboard-tablet')
    evidence.responsive.tablet = { width: 768, height: 1024 }

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(dashboardTitle).toBeVisible()
    evidence.screenshots.mobile = await attachScreenshot(testInfo, page, 'dashboard-mobile')
    evidence.responsive.mobile = { width: 390, height: 844 }

    evidence.api.responses = cmsResponses
    const evidencePath = testInfo.outputPath('cms-admin-dashboard-evidence.json')
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2))
    await testInfo.attach('cms-admin-dashboard-evidence', {
      path: evidencePath,
      contentType: 'application/json',
    })

    expect(consoleErrors).toEqual([])
    expect(apiErrors).toEqual([])
  })
})
