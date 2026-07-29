const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')
const { defineConfig, devices } = require('@playwright/test')

const envFiles = ['.env.test.local', '.env.local', '.env']
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, envFile)
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false, quiet: true })
  }
}

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3200'
const parsedBaseUrl = new URL(baseURL)
const isManagedLocalServerHost = /^(127\.0\.0\.1|localhost)$/i.test(parsedBaseUrl.hostname)
const localServerHost = parsedBaseUrl.hostname || '127.0.0.1'
const localServerPort = parsedBaseUrl.port || (parsedBaseUrl.protocol === 'https:' ? '443' : '80')
const serverCommand = `"${process.execPath}" "${path.join(__dirname, 'scripts', 'playwright-webserver.cjs')}" --hostname ${localServerHost} --port ${localServerPort}`
const healthCheckUrl = new URL('/api/health', baseURL).toString()

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  timeout: 120000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: isManagedLocalServerHost
    ? {
        command: serverCommand,
        url: healthCheckUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      }
    : undefined,
})
