const { test, expect } = require('@playwright/test')

test.describe('Admin Security', () => {
  test('public config endpoint returns only allow-listed browser-safe fields', async ({ request }) => {
    const response = await request.get('/api/public-config')
    expect(response.ok()).toBeTruthy()

    const payload = await response.json()
    expect(payload.success === true || payload.success === false).toBeTruthy()

    const keys = Object.keys(payload.data || {}).sort()
    expect(keys).toEqual(['anonKey', 'url'])

    const serialized = JSON.stringify(payload)
    expect(serialized.includes('service_role')).toBeFalsy()
    expect(serialized.includes('SUPABASE_SERVICE_ROLE_KEY')).toBeFalsy()
  })

  test('unauthenticated requests cannot access admin session details', async ({ request }) => {
    const response = await request.get('/api/admin/session')
    expect([401, 403]).toContain(response.status())
  })

  test('unauthenticated requests cannot access protected CMS APIs', async ({ request }) => {
    const protectedRoutes = [
      '/api/cms/users',
      '/api/cms/settings',
      '/api/cms/media',
    ]

    for (const route of protectedRoutes) {
      const response = await request.get(route)
      expect([401, 403]).toContain(response.status())
    }
  })
})
