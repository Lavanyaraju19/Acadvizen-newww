const { test, expect } = require('@playwright/test')

const HTML_ROUTES = [
  '/',
  '/blog',
  '/courses',
  '/projects',
  '/tools',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
]

test.describe('Public Smoke', () => {
  for (const route of HTML_ROUTES) {
    test(`serves ${route} without a server-rendered error shell`, async ({ request }) => {
      const response = await request.get(route)
      expect(response.ok()).toBeTruthy()
      expect(response.headers()['content-type'] || '').toContain('text/html')

      const html = await response.text()
      expect(html.includes('Internal Server Error')).toBeFalsy()
      expect(html.includes('Application error')).toBeFalsy()
      expect(html.includes('Unhandled Runtime Error')).toBeFalsy()
    })
  }

  test('serves robots.txt successfully', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.ok()).toBeTruthy()

    const text = await response.text()
    expect(text.toLowerCase()).toContain('user-agent')
  })

  test('serves sitemap.xml successfully', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()

    const xml = await response.text()
    expect(xml.includes('<urlset') || xml.includes('<sitemapindex')).toBeTruthy()
  })
})
