const { test, expect } = require('@playwright/test')
const {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  browserApiFetch,
  createScopedCmsValue,
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
  loginAdmin,
} = require('./utils')

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)

test.describe('CMS Bulk Import', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required for bulk import tests')
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for bulk import tests')

  test('importing a page whose slug already exists is rejected, not silently duplicated', async ({ browser }) => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const supabase = createSupabaseAdminClient()
    const slug = createScopedCmsValue('bulk-import-page')

    try {
      await loginAdmin(adminPage)

      const firstImport = await browserApiFetch(adminPage, '/api/cms/import-export/import', {
        method: 'POST',
        body: {
          type: 'pages',
          format: 'json',
          data: [{ title: `${slug} title`, slug, status: 'draft' }],
        },
      })
      expect(firstImport?.data?.success).toBe(1)
      expect(firstImport?.data?.failed).toBe(0)

      const { data: rowsAfterFirstImport } = await supabase.from('pages').select('id').eq('slug', slug)
      expect(rowsAfterFirstImport?.length).toBe(1)

      // Import a second row with the SAME slug - this must be reported as a failure, and
      // must not leave a second row with the same slug in the table.
      const secondImport = await browserApiFetch(adminPage, '/api/cms/import-export/import', {
        method: 'POST',
        body: {
          type: 'pages',
          format: 'json',
          data: [{ title: `${slug} title duplicate`, slug, status: 'draft' }],
        },
      })
      expect(secondImport?.data?.failed).toBe(1)
      expect(secondImport?.data?.success).toBe(0)
      expect(secondImport?.data?.errors?.[0] || '').toMatch(/already exists/i)

      const { data: rowsAfterSecondImport } = await supabase.from('pages').select('id').eq('slug', slug)
      expect(rowsAfterSecondImport?.length).toBe(1)
    } finally {
      await supabase.from('pages').delete().eq('slug', slug)
      await adminContext.close()
    }
  })
})
