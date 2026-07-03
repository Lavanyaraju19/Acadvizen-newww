require('dotenv').config();
const { expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'operation@acadvizen.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Acadvizen2026';

async function loginAdmin(page) {
  await page.goto('/admin-login');
  await page.waitForLoadState('domcontentloaded');

  // Check if already logged in or if there's an error
  const currentUrl = page.url();
  if (currentUrl.includes('/admin') && !currentUrl.includes('login')) {
    // If we're on an admin page but not login, check if we have access
    const errorElement = page.locator('text=Admin Access Error, text=Unable to open the admin dashboard');
    if (await errorElement.count() > 0) {
      // Session expired, need to login again
      await page.goto('/admin-login');
      await page.waitForLoadState('domcontentloaded');
    } else {
      return;
    }
  }

  // Fill in login form
  await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"], button:has-text("Sign in")');

  // Wait for navigation - either to /admin or handle error
  try {
    await page.waitForURL(/\/admin($|\/)/, { timeout: 20000 });
  } catch (e) {
    // Check if we're still on login page with error
    const errorElement = page.locator('text=Sign in failed, text=Access denied, text=Unable to sign in');
    if (await errorElement.count() > 0) {
      throw new Error('Login failed - authentication error');
    }
    // If not on admin, might be redirected elsewhere, check current URL
    const finalUrl = page.url();
    if (!finalUrl.includes('/admin')) {
      throw new Error(`Login failed - redirected to ${finalUrl} instead of /admin`);
    }
  }
  
  await page.waitForLoadState('domcontentloaded');
  
  // Verify we're not on an error page
  const errorElement = page.locator('text=Admin Access Error, text=Unable to open the admin dashboard');
  if (await errorElement.count() > 0) {
    throw new Error('Login failed - admin access error after login');
  }
}

async function checkAndHandleSessionError(page) {
  const errorElement = page.locator('text=Admin Access Error, text=Unable to open the admin dashboard');
  if (await errorElement.count() > 0) {
    // Session expired, need to login again
    // Try clicking Retry first
    const retryButton = page.locator('button:has-text("Retry")');
    if (await retryButton.count() > 0) {
      await retryButton.first().click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      // If no retry button, go back to login
      await loginAdmin(page);
    }
    
    // Check if error persists after retry
    const errorAfterRetry = page.locator('text=Admin Access Error, text=Unable to open the admin dashboard');
    if (await errorAfterRetry.count() > 0) {
      // Still have error, need to login again
      await loginAdmin(page);
    }
  }
}

async function waitForSuccessMessage(page) {
  // Wait for any success indicator
  await page.waitForTimeout(2000);
  // Check for common success messages
  const successMessage = page.locator('p').filter({ hasText: /Saved|Deleted|Created|Duplicated|uploaded|saved|deleted|success/i });
  if (await successMessage.count() > 0) {
    await successMessage.first().waitFor({ state: 'visible', timeout: 5000 });
  }
}

async function fillForm(page, fields) {
  for (const [key, value] of Object.entries(fields)) {
    const selector = `input[name="${key}"], textarea[name="${key}"], select[name="${key}"]`;
    const element = page.locator(selector).first();

    if (typeof value === 'boolean') {
      const checkbox = page.locator(`input[type="checkbox"][name="${key}"]`).first();
      const isChecked = await checkbox.isChecked();
      if (isChecked !== value) {
        await checkbox.check();
      }
    } else if (await element.isVisible()) {
      await element.fill(String(value));
    }
  }
}

async function verifyRecordExists(page, recordSelector) {
  await expect(page.locator(recordSelector)).toBeVisible();
}

async function verifyRecordNotExists(page, recordSelector) {
  await expect(page.locator(recordSelector)).not.toBeVisible();
}

module.exports = {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  loginAdmin,
  checkAndHandleSessionError,
  waitForSuccessMessage,
  fillForm,
  verifyRecordExists,
  verifyRecordNotExists,
};
