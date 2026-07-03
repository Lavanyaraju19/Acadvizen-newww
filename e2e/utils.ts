import { Page, expect } from '@playwright/test';

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@acadvizen.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function loginAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  // Check if already logged in
  const currentUrl = page.url();
  if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
    return;
  }

  // Fill in login form
  await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"], button:has-text("Login")');

  // Wait for navigation to admin dashboard
  await page.waitForURL(/\/admin($|\/)/);
  await page.waitForLoadState('networkidle');
}

export async function waitForSuccessMessage(page: Page) {
  await page.waitForSelector('p:has-text("Saved"), p:has-text("Deleted"), p:has-text("Created")', { timeout: 10000 });
}

export async function fillForm(page: Page, fields: Record<string, string | boolean>) {
  for (const [key, value] of Object.entries(fields)) {
    const selector = `input[name="${key}"], textarea[name="${key}"], select[name="${key}"]`;
    const element = await page.locator(selector).first();

    if (typeof value === 'boolean') {
      const checkbox = await page.locator(`input[type="checkbox"][name="${key}"]`).first();
      const isChecked = await checkbox.isChecked();
      if (isChecked !== value) {
        await checkbox.check();
      }
    } else if (await element.isVisible()) {
      await element.fill(String(value));
    }
  }
}

export async function createRecord(page: Page, entityName: string, fields: Record<string, string | boolean>) {
  await page.goto(`/admin/${entityName}`);
  await page.waitForLoadState('networkidle');

  // Click New button
  await page.click('button:has-text("New")');
  await page.waitForTimeout(500);

  // Fill form
  await fillForm(page, fields);

  // Save
  await page.click('button[type="submit"]:has-text("Save")');
  await waitForSuccessMessage(page);
}

export async function editRecord(page: Page, entityName: string, recordSelector: string, fields: Record<string, string | boolean>) {
  await page.goto(`/admin/${entityName}`);
  await page.waitForLoadState('networkidle');

  // Click on the record
  await page.click(recordSelector);
  await page.waitForTimeout(500);

  // Fill form with new values
  await fillForm(page, fields);

  // Save
  await page.click('button[type="submit"]:has-text("Save")');
  await waitForSuccessMessage(page);
}

export async function deleteRecord(page: Page, entityName: string, recordSelector: string) {
  await page.goto(`/admin/${entityName}`);
  await page.waitForLoadState('networkidle');

  // Click on the record
  await page.click(recordSelector);
  await page.waitForTimeout(500);

  // Delete
  page.on('dialog', dialog => dialog.accept());
  await page.click('button:has-text("Delete")');
  await waitForSuccessMessage(page);
}

export async function verifyRecordExists(page: Page, recordSelector: string) {
  await expect(page.locator(recordSelector)).toBeVisible();
}

export async function verifyRecordNotExists(page: Page, recordSelector: string) {
  await expect(page.locator(recordSelector)).not.toBeVisible();
}

export async function uploadFile(page: Page, fileInputSelector: string, filePath: string) {
  const fileInput = page.locator(fileInputSelector);
  await fileInput.setInputFiles(filePath);
}

export function generateTestId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}
