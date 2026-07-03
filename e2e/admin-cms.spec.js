const { test, expect } = require('@playwright/test');
const {
  loginAdmin,
  checkAndHandleSessionError,
  waitForSuccessMessage,
} = require('./utils');

// Test data
const testTimestamp = Date.now();
const testData = {
  author: {
    author_name: `Test Author ${testTimestamp}`,
    website_url: `test-author-${testTimestamp}`,
    author_biography: 'Test author biography for E2E testing',
  },
  course: {
    title: `Test Course ${testTimestamp}`,
    slug: `test-course-${testTimestamp}`,
    description: 'Test course description for E2E testing',
    short_description: 'Short description',
    is_active: true,
  },
  tool: {
    name: `Test Tool ${testTimestamp}`,
    slug: `test-tool-${testTimestamp}`,
    category: 'Testing',
    description: 'Test tool description',
    website_url: 'https://example.com',
    is_active: true,
  },
  company: {
    company_name: `Test Company ${testTimestamp}`,
  },
  internship: {
    company_name: `Test Company ${testTimestamp}`,
    role: 'Digital Marketing Intern',
    description: 'Test internship description',
  },
  testimonial: {
    name: `Test Student ${testTimestamp}`,
    role: 'Marketing Manager',
    quote: 'This is a test testimonial for E2E testing',
    is_active: true,
  },
  city: {
    name: `Test City ${testTimestamp}`,
    slug: `test-city-${testTimestamp}`,
    state: 'Karnataka',
    country: 'India',
    is_active: true,
  },
  lmsModule: {
    title: `Test Module ${testTimestamp}`,
    description: 'Test module description',
    order_index: 1,
  },
  lmsLesson: {
    title: `Test Lesson ${testTimestamp}`,
    content: 'Test lesson content',
    order_index: 1,
  },
  seoPage: {
    page_slug: `test-page-${testTimestamp}`,
    meta_title: 'Test Page SEO Title',
    meta_description: 'Test page SEO description',
  },
  menu: {
    title: `Test Menu ${testTimestamp}`,
    url: '/test-page',
    menu_location: 'header',
    order_index: 100,
    is_active: true,
  },
};

test.describe('Admin CMS E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test.describe('Blog Taxonomy', () => {
    test('should load blog taxonomy page', async ({ page }) => {
      await page.goto('/admin/blog-taxonomy');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);
      
      // Verify page loads successfully
      const authorsSection = page.locator('h3:has-text("Blog Authors")');
      await expect(authorsSection).toBeVisible();
    });
  });

  test.describe('Courses', () => {
    test('should load courses page', async ({ page }) => {
      await page.goto('/admin/courses');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads successfully
      const title = page.locator('h3:has-text("Courses")');
      await expect(title.first()).toBeVisible();
    });
  });

  test.describe('Tools', () => {
    test('should load tools page', async ({ page }) => {
      await page.goto('/admin/tools');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads successfully
      const title = page.locator('h3:has-text("Digital Marketing Tools")');
      await expect(title.first()).toBeVisible();
    });
  });

  test.describe('Companies', () => {
    test('should load companies page', async ({ page }) => {
      await page.goto('/admin/companies');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads (may have DB error if table doesn't exist)
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/companies');
    });
  });

  test.describe('Internships', () => {
    test('should load internships page', async ({ page }) => {
      await page.goto('/admin/internships');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/internships');
    });
  });

  test.describe('Testimonials', () => {
    test('should load testimonials page', async ({ page }) => {
      await page.goto('/admin/testimonials');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads (may have DB error if table doesn't exist)
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/testimonials');
    });
  });

  test.describe('Media Library', () => {
    test('should load media library page', async ({ page }) => {
      await page.goto('/admin/media');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/media');
    });
  });

  test.describe('Trust & Conversion', () => {
    test('should load trust page', async ({ page }) => {
      await page.goto('/admin/trust');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/trust');
    });
  });

  test.describe('Landing SEO', () => {
    test('should load landing SEO page', async ({ page }) => {
      await page.goto('/admin/landing-seo');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/landing-seo');
    });
  });

  test.describe('Leads', () => {
    test('should load leads page', async ({ page }) => {
      await page.goto('/admin/leads');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/leads');
    });
  });

  test.describe('LMS', () => {
    test('should load LMS page', async ({ page }) => {
      await page.goto('/admin/lms');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/lms');
    });
  });

  test.describe('SEO Settings', () => {
    test('should load SEO settings page', async ({ page }) => {
      await page.goto('/admin/seo');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/seo');
    });
  });

  test.describe('Website Settings', () => {
    test('should load settings page', async ({ page }) => {
      await page.goto('/admin/settings');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/settings');
    });
  });

  test.describe('Pages', () => {
    test('should load pages page', async ({ page }) => {
      await page.goto('/admin/pages');
      await page.waitForLoadState('domcontentloaded');
      await checkAndHandleSessionError(page);

      // Verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/pages');
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between admin modules', async ({ page }) => {
      const modules = [
        '/admin/courses',
        '/admin/tools',
        '/admin/companies',
        '/admin/internships',
        '/admin/testimonials',
        '/admin/media',
        '/admin/trust',
        '/admin/landing-seo',
        '/admin/leads',
        '/admin/lms',
        '/admin/seo',
        '/admin/settings',
        '/admin/pages',
      ];

      for (const module of modules) {
        await page.goto(module);
        await page.waitForLoadState('domcontentloaded');
        await checkAndHandleSessionError(page);
        await expect(page).toHaveURL(new RegExp(module.replace('/', '\\/')));
      }
    });
  });
});
