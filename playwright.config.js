const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')
const { defineConfig, devices } = require('@playwright/test')

const envFiles = ['.env.local', '.env.test.local', '.env']
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
  // Diagnosed directly against this local Windows/Docker-Desktop/Chromium stack: repeated
  // full-suite runs showed a consistent, reproducible pattern of arbitrary requests
  // (most often the admin login POST) exceeding their timeout mid-run, while the exact same
  // flow succeeded reliably in well under a second when driven by a plain script outside the
  // Playwright test-runner. Disabling video recording (continuous per-test frame capture)
  // removed the login-specific hang entirely across multiple re-runs; a single retry absorbs
  // whatever lower-level intermittent slowness remains without masking a genuine, repeatable
  // product failure (which would still fail on the retry too).
  retries: process.env.CI ? 0 : 1,
  workers: 1,
  reporter: 'html',
  timeout: 120000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
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
