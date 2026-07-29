const { test, expect } = require('@playwright/test')
const {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  loginAdmin,
  checkAndHandleSessionError,
} = require('./utils')

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)

// Test data
const testTimestamp = Date.now()
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
}

// List of all admin modules that should be accessible
const ADMIN_MODULES = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/homepage', label: 'Homepage Builder' },
  { path: '/admin/header', label: 'Header' },
  { path: '/admin/footer', label: 'Footer' },
  { path: '/admin/menus', label: 'Menus' },
  { path: '/admin/pages', label: 'Pages' },
  { path: '/admin/blogs', label: 'Blogs' },
  { path: '/admin/blog-taxonomy', label: 'Blog Taxonomy' },
  { path: '/admin/courses', label: 'Courses' },
  { path: '/admin/tools', label: 'Tools' },
  { path: '/admin/companies', label: 'Companies' },
  { path: '/admin/internships', label: 'Internships' },
  { path: '/admin/testimonials', label: 'Testimonials' },
  { path: '/admin/cities', label: 'Cities' },
  { path: '/admin/media', label: 'Media Library' },
  { path: '/admin/forms', label: 'Forms' },
  { path: '/admin/popups', label: 'Popups' },
  { path: '/admin/banners', label: 'Banners' },
  { path: '/admin/redirects', label: 'Redirects' },
  { path: '/admin/sitemap', label: 'Sitemap' },
  { path: '/admin/robots', label: 'Robots.txt' },
  { path: '/admin/sections', label: 'Reusable Sections' },
  { path: '/admin/templates', label: 'Page Templates' },
  { path: '/admin/landing-seo', label: 'Landing SEO' },
  { path: '/admin/trust', label: 'Trust & Conversion' },
  { path: '/admin/trust-conversion', label: 'Trust & Conversion (alt)' },
  { path: '/admin/leads', label: 'Leads' },
  { path: '/admin/lms', label: 'LMS' },
  { path: '/admin/seo', label: 'SEO Settings' },
  { path: '/admin/settings', label: 'Settings' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/course-details', label: 'Course Details' },
  { path: '/admin/import-export', label: 'Import/Export' },
  { path: '/admin/resources', label: 'Resources' },
  { path: '/admin/students', label: 'Students' },
]

test.describe('Admin CMS E2E Tests', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required for admin CMS workflows')

  /** @type {import('@playwright/test').BrowserContext | null} */
  let adminContext = null
  /** @type {import('@playwright/test').Page | null} */
  let adminPage = null

  test.beforeAll(async ({ browser }) => {
    adminContext = await browser.newContext()
    adminPage = await adminContext.newPage()
    await loginAdmin(adminPage)
  })

  test.afterAll(async () => {
    await adminContext?.close()
    adminContext = null
    adminPage = null
  })

  for (const mod of ADMIN_MODULES) {
    test.describe(mod.label, () => {
      test(`should load ${mod.label} page at ${mod.path}`, async () => {
        await adminPage.goto(mod.path)
        await adminPage.waitForLoadState('domcontentloaded')
        await checkAndHandleSessionError(adminPage)
        await expect(adminPage).toHaveURL(new RegExp(mod.path.replace('/', '\\/')))
      })
    })
  }

  test.describe('Navigation', () => {
    test('should navigate between all admin modules without session expiry', async () => {
      for (const mod of ADMIN_MODULES) {
        await adminPage.goto(mod.path)
        await adminPage.waitForLoadState('domcontentloaded')
        await checkAndHandleSessionError(adminPage)
        await expect(adminPage).toHaveURL(new RegExp(mod.path.replace('/', '\\/')))
      }
    })
  })

  test.describe('Session Persistence', () => {
    test('should maintain session across multiple module navigations', async () => {
      const sampleModules = ADMIN_MODULES
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)

      for (const mod of sampleModules) {
        await adminPage.goto(mod.path)
        await adminPage.waitForLoadState('domcontentloaded')
        await checkAndHandleSessionError(adminPage)
        await expect(adminPage).toHaveURL(new RegExp(mod.path.replace('/', '\\/')))
      }
    })

    test('should survive page refresh without session loss', async () => {
      await adminPage.goto('/admin')
      await adminPage.waitForLoadState('domcontentloaded')
      await checkAndHandleSessionError(adminPage)

      await adminPage.reload()
      await adminPage.waitForLoadState('domcontentloaded')

      await expect(adminPage).toHaveURL(/\/admin($|\/)/)
    })
  })
})
