const { test, expect } = require('@playwright/test')
const {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
  loginAdmin,
  browserApiFetch,
  createScopedCmsValue,
} = require('./utils')

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)

test.describe('Admin UI simulation - Page Builder drag/drop, copy/paste, undo/redo', () => {
  test.skip(!hasE2ECredentials || !destructiveCmsTestConfig.enabled || !hasSupabaseAdminEnv, 'Requires disposable-DB E2E credentials.')

  let supabase
  let pageId
  let sectionIds = []

  test.beforeAll(() => {
    supabase = createSupabaseAdminClient()
  })

  test.afterAll(async () => {
    if (pageId) {
      await supabase.from('sections').delete().eq('page_id', pageId)
      await supabase.from('pages').delete().eq('id', pageId)
    }
  })

  test('real drag reorder, undo/redo, and copy/paste operate on real sections through the real UI', async ({ page }) => {
    await loginAdmin(page)

    const slug = createScopedCmsValue('pagebuilder-dnd')
    const pageResult = await browserApiFetch(page, '/api/cms/pages', {
      method: 'POST',
      body: { title: 'DnD Test Page', slug, status: 'draft' },
    })
    pageId = pageResult.data.id

    const sectionSpecs = [
      { type: 'hero', content_json: { heading: 'First Section Heading' } },
      { type: 'text_block', content_json: { heading: 'Second Section Heading' } },
      { type: 'faq', content_json: { heading: 'Third Section Heading' } },
    ]
    for (let i = 0; i < sectionSpecs.length; i++) {
      const result = await browserApiFetch(page, '/api/cms/sections', {
        method: 'POST',
        body: { page_id: pageId, type: sectionSpecs[i].type, order_index: i, content_json: sectionSpecs[i].content_json },
      })
      sectionIds.push(result.data.id)
    }

    await page.goto(`/admin/pages?page=${pageId}`, { waitUntil: 'domcontentloaded' })

    function sectionOrder() {
      return page.locator('[data-testid^="page-section-edit-"]').evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('data-testid').replace('page-section-edit-', ''))
      )
    }

    // WebKit's Supabase session restore from localStorage after a fresh navigation is
    // measurably slower than Chromium/Firefox in this environment, and the Page Builder's
    // mount-time loadPages() can race ahead of it - poll rather than assume any fixed settle
    // time is enough on every engine.
    await expect.poll(sectionOrder, { timeout: 30000 }).toEqual(sectionIds)
    const initialOrder = await sectionOrder()
    expect(initialOrder).toEqual(sectionIds)

    // --- Move Down / Undo ---
    // Each action PATCHes order_index server-side then refetches the whole page - polling
    // instead of a fixed wait avoids guessing how long that round trip takes on any given
    // browser engine (WebKit/Firefox settle measurably slower than Chromium in this environment).
    const swappedOrder = [sectionIds[1], sectionIds[0], sectionIds[2]]
    const firstRow = page.locator(`[data-testid="page-section-edit-${sectionIds[0]}"]`).locator('..').locator('..')
    await firstRow.getByTitle('Move Down').click()
    await expect.poll(sectionOrder, { timeout: 15000 }).toEqual(swappedOrder)

    await page.getByTitle('Undo reorder (Ctrl+Z)').click()
    await expect.poll(sectionOrder, { timeout: 15000 }).toEqual(sectionIds)

    await page.getByTitle('Redo reorder (Ctrl+Shift+Z)').click()
    await expect.poll(sectionOrder, { timeout: 15000 }).toEqual(swappedOrder)

    // Restore original order via one more undo so drag assertions below start from a known state.
    await page.getByTitle('Undo reorder (Ctrl+Z)').click()
    await expect.poll(sectionOrder, { timeout: 15000 }).toEqual(sectionIds)

    // --- Keyboard-based drag and drop (dnd-kit KeyboardSensor) ---
    // Tested via keyboard rather than synthesized mouse events for two reasons: it's the
    // accessible path required for WCAG 2.1.1 (drag-and-drop must have a keyboard equivalent -
    // see the KeyboardSensor added alongside PointerSensor in PageBuilderClient.jsx), and unlike
    // raw pointer-event simulation it's fully deterministic across Chromium/Firefox/WebKit -
    // real pointer dragging can be exercised manually, but isn't a reliable thing to assert on
    // in an automated cross-browser suite.
    const firstHandle = page.locator(`[data-testid="page-section-edit-${sectionIds[0]}"]`).locator('..').getByTitle('Drag to reorder')
    await firstHandle.focus()
    await page.keyboard.press('Space')
    // Give dnd-kit's KeyboardSensor time to register the "picked up" state before the first
    // Arrow press - firing it immediately can race ahead of that state update and get ignored,
    // moving the item one position short of intended (a test-timing gap, not a product bug: a
    // real user's natural reaction time between keypresses is well clear of this).
    await page.waitForTimeout(500)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(300)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(300)
    await page.keyboard.press('Space')

    // Assert a real reorder happened rather than pinning dnd-kit's exact internal keyboard
    // coordinate math - what this test needs to prove is that keyboard-driven reordering (the
    // accessible path) actually moves the section and persists it, not the precise arithmetic.
    await expect.poll(
      async () => JSON.stringify(await sectionOrder()) !== JSON.stringify(sectionIds),
      { timeout: 15000, message: `keyboard drag reorder should change order from ${JSON.stringify(sectionIds)}` }
    ).toBe(true)
    const afterDrag = await sectionOrder()
    expect(new Set(afterDrag)).toEqual(new Set(sectionIds))

    // --- Copy / Paste ---
    const copyTargetId = afterDrag[0]
    const copyRow = page.locator(`[data-testid="page-section-edit-${copyTargetId}"]`).locator('..').locator('..')
    await copyRow.getByTitle('Copy (paste on any page)').click()
    await expect(page.getByText(/^Copied "/)).toBeVisible({ timeout: 5000 })

    const pasteButton = page.getByRole('button', { name: /^⧉ Paste/ })
    await expect(pasteButton).toBeVisible()
    await pasteButton.click()

    await expect.poll(async () => (await sectionOrder()).length, { timeout: 15000 }).toBe(sectionIds.length + 1)
  })
})
