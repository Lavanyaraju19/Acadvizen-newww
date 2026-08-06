const fs = require('node:fs')
const { test, expect } = require('@playwright/test')
const {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  E2E_BASE_URL,
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
  loginAdmin,
  isBenignConsoleMessage,
} = require('./utils')

const TITLE = 'Dropshipping Course in Bangalore'
const INITIAL_SLUG = 'dropshipping-course-in-bangalore'
const UPDATED_SLUG = 'dropshipping-course-in-bangalore-updated-e2e'
const MARKER = 'ACADVIZEN_DROPSHIPPING_ADMIN_E2E'

const hasE2ECredentials = Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD)

function absoluteUrl(pathname = '/') {
  return new URL(pathname, E2E_BASE_URL).toString()
}

function expectedCanonicalUrl(slug) {
  return absoluteUrl(`/${slug}`)
}

function sitemapHasExactPath(xml, pathname) {
  const expected = new URL(pathname, E2E_BASE_URL).pathname.replace(/\/+$/, '') || '/'
  const matches = Array.from(String(xml || '').matchAll(/<loc>([^<]+)<\/loc>/g))
  return matches.some((match) => {
    try {
      const path = new URL(match[1]).pathname.replace(/\/+$/, '') || '/'
      return path === expected
    } catch {
      return false
    }
  })
}

async function maybeSingle(query, label) {
  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(`${label}: ${error.message}`)
  return data || null
}

async function listRows(query, label) {
  const { data, error } = await query
  if (error) throw new Error(`${label}: ${error.message}`)
  return Array.isArray(data) ? data : []
}

async function optionalMaybeSingle(query, label) {
  const { data, error } = await query.maybeSingle()
  if (!error) return { data: data || null, error: null }
  const message = error.message || String(error)
  if (message.includes('schema cache') || message.includes('does not exist') || error.code === 'PGRST205') {
    return { data: null, error: message }
  }
  throw new Error(`${label}: ${message}`)
}

async function findPageBySlug(supabase, slug) {
  return maybeSingle(supabase.from('pages').select('*').eq('slug', slug), `load page ${slug}`)
}

async function findTemporaryOriginalPages(supabase) {
  return listRows(
    supabase
      .from('pages')
      .select('*')
      .like('slug', `${INITIAL_SLUG}-original-backup-%`)
      .order('updated_at', { ascending: false }),
    'load temporary original page backups'
  )
}

async function findPageById(supabase, id) {
  return maybeSingle(supabase.from('pages').select('*').eq('id', id), `load page ${id}`)
}

async function findSectionsForPage(supabase, pageId) {
  return listRows(
    supabase.from('sections').select('*').eq('page_id', pageId).order('order_index', { ascending: true }),
    `load sections for ${pageId}`
  )
}

async function findRedirect(supabase, fromPath) {
  return maybeSingle(supabase.from('redirects').select('*').eq('from_path', fromPath), `load redirect ${fromPath}`)
}

async function listTestPathRedirects(supabase) {
  const fromResult = await supabase
    .from('redirects')
    .select('*')
    .in('from_path', [`/${INITIAL_SLUG}`, `/${UPDATED_SLUG}`])
  if (fromResult.error) throw new Error(`load redirects by from_path: ${fromResult.error.message}`)

  const toResult = await supabase
    .from('redirects')
    .select('*')
    .in('to_path', [`/${INITIAL_SLUG}`, `/${UPDATED_SLUG}`])
  if (toResult.error) throw new Error(`load redirects by to_path: ${toResult.error.message}`)

  const rows = [...(fromResult.data || []), ...(toResult.data || [])]
  const seen = new Set()
  return rows.filter((row) => {
    if (!row?.id || seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })
}

function recordSummary(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || row.name || null,
    status: row.status || null,
    is_active: row.is_active ?? null,
    updated_at: row.updated_at || null,
    published_at: row.published_at || null,
  }
}

function isPriorE2EPage(page, sections = []) {
  if (!page) return false
  const searchable = [
    page.description,
    page.seo_description,
    page.title,
    ...sections.flatMap((section) => [
      JSON.stringify(section.content_json || {}),
      JSON.stringify(section.style_json || {}),
    ]),
  ].join('\n')
  return searchable.includes(MARKER)
}

function restorePayloadFromPage(page) {
  const payload = {}
  for (const key of ['title', 'slug', 'description', 'seo_title', 'seo_description', 'status', 'created_at', 'updated_at']) {
    if (key in page) payload[key] = page[key]
  }
  return payload
}

async function updatePageRow(supabase, id, payload, label) {
  const { data, error } = await supabase
    .from('pages')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

async function deletePageById(supabase, id) {
  if (!id) return
  await supabase.from('sections').delete().eq('page_id', id)
  await supabase.from('pages').delete().eq('id', id)
}

async function cleanupRedirects(supabase, baselineRedirectIds = []) {
  const baseline = new Set(baselineRedirectIds)
  const redirects = await listTestPathRedirects(supabase)
  const createdIds = redirects.map((redirect) => redirect.id).filter((id) => id && !baseline.has(id))
  if (createdIds.length) {
    const { error } = await supabase.from('redirects').delete().in('id', createdIds)
    if (error) throw new Error(`cleanup redirects: ${error.message}`)
  }
}

async function cleanupCreatedPage(supabase, createdPageId, baselineRedirectIds = []) {
  await deletePageById(supabase, createdPageId)
  await cleanupRedirects(supabase, baselineRedirectIds)
}

async function prepareExactSlugForTest(supabase, evidence, runId) {
  let page = await findPageBySlug(supabase, INITIAL_SLUG)
  const updatedPage = await findPageBySlug(supabase, UPDATED_SLUG)
  const baselineRedirects = await listTestPathRedirects(supabase)
  const temporaryOriginalPages = await findTemporaryOriginalPages(supabase)
  const locationPageResult = await optionalMaybeSingle(
    supabase.from('location_pages').select('*').eq('slug', INITIAL_SLUG),
    `load location page ${INITIAL_SLUG}`
  )
  const cityPageResult = await optionalMaybeSingle(
    supabase.from('city_pages').select('*').eq('slug', INITIAL_SLUG),
    `load city page ${INITIAL_SLUG}`
  )
  const locationPage = locationPageResult.data
  const cityPage = cityPageResult.data

  evidence.original_failing_page_check = {
    pages: recordSummary(page),
    location_pages: recordSummary(locationPage),
    city_pages: recordSummary(cityPage),
    location_pages_error: locationPageResult.error,
    city_pages_error: cityPageResult.error,
    redirect_ids: baselineRedirects.map((redirect) => redirect.id),
    temporary_original_pages: temporaryOriginalPages.map(recordSummary),
  }

  if (updatedPage) {
    const sections = await findSectionsForPage(supabase, updatedPage.id)
    if (!isPriorE2EPage(updatedPage, sections)) {
      throw new Error(
        `Refusing to overwrite existing non-test CMS page "${UPDATED_SLUG}" (${updatedPage.id}).`
      )
    }
    await deletePageById(supabase, updatedPage.id)
  }

  if (locationPage || cityPage) {
    throw new Error(
      `The exact test slug exists outside standard pages. location_pages=${locationPage?.id || 'none'}, city_pages=${cityPage?.id || 'none'}.`
    )
  }

  let originalPage = null
  let temporarySlug = ''
  if (page) {
    const sections = await findSectionsForPage(supabase, page.id)
    if (isPriorE2EPage(page, sections)) {
      await deletePageById(supabase, page.id)
      const staleOriginal = temporaryOriginalPages.find((candidate) => !isPriorE2EPage(candidate, []))
      if (staleOriginal) {
        page = await updatePageRow(
          supabase,
          staleOriginal.id,
          { slug: INITIAL_SLUG },
          'restore stale original page before fresh test run'
        )
        evidence.original_page_stale_restore = recordSummary(page)
      } else {
        page = null
      }
    }
  }

  if (page) {
    const sections = await findSectionsForPage(supabase, page.id)
    if (isPriorE2EPage(page, sections)) {
      await deletePageById(supabase, page.id)
    } else {
      originalPage = page
      temporarySlug = `${INITIAL_SLUG}-original-backup-${runId}`
      await updatePageRow(supabase, page.id, { slug: temporarySlug }, 'temporarily rename original page')
      evidence.original_page_temporary_slug = temporarySlug
    }
  }

  await cleanupRedirects(supabase, baselineRedirects.map((redirect) => redirect.id))
  return {
    originalPage,
    temporarySlug,
    baselineRedirectIds: baselineRedirects.map((redirect) => redirect.id),
  }
}

async function restoreOriginalPage(supabase, prepared, evidence) {
  if (!prepared?.originalPage?.id) return
  await updatePageRow(
    supabase,
    prepared.originalPage.id,
    restorePayloadFromPage(prepared.originalPage),
    'restore original page'
  )
  const restored = await findPageById(supabase, prepared.originalPage.id)
  evidence.original_page_restored = {
    expected: recordSummary(prepared.originalPage),
    actual: recordSummary(restored),
    slug_restored: restored?.slug === prepared.originalPage.slug,
    title_restored: restored?.title === prepared.originalPage.title,
    status_restored: restored?.status === prepared.originalPage.status,
    e2e_marker_present: JSON.stringify(restored || {}).includes(MARKER),
  }
}

async function attachScreenshot(testInfo, page, name) {
  const path = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path, fullPage: true })
  await testInfo.attach(name, { path, contentType: 'image/png' })
  return path
}

async function waitForPageApiResponse(page, action) {
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/cms/pages') && response.request().method() === 'POST',
    { timeout: 30000 }
  )
  await action()
  const response = await responsePromise
  const json = await response.json()
  expect(response.ok(), JSON.stringify(json)).toBe(true)
  expect(json.success, JSON.stringify(json)).not.toBe(false)
  return { status: response.status(), json }
}

async function waitForSectionPatchApiResponse(page, sectionId, action) {
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes(`/api/cms/sections/${sectionId}`) && response.request().method() === 'PATCH',
    { timeout: 30000 }
  )
  await action()
  const response = await responsePromise
  const json = await response.json()
  expect(response.ok(), JSON.stringify(json)).toBe(true)
  expect(json.success, JSON.stringify(json)).not.toBe(false)
  return { status: response.status(), json }
}

async function fetchPublic(pathname) {
  const response = await fetch(absoluteUrl(pathname), { redirect: 'manual', cache: 'no-store' })
  return {
    status: response.status,
    location: response.headers.get('location'),
    text: await response.text(),
  }
}

async function verifyLivePage(browser, pathname, title, bodyText, testInfo, name, viewport = null) {
  const context = await browser.newContext(viewport ? { viewport } : undefined)
  const page = await context.newPage()
  try {
    const response = await page.goto(pathname, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    // Wait for client-side hydration to fully settle before asserting on content.
    // Asserting immediately after 'domcontentloaded' can observe a transient
    // in-between paint while React reconciles the streamed RSC payload,
    // which briefly duplicates text nodes for a single CMS section.
    await page.waitForLoadState('networkidle').catch(() => {})
    await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(bodyText, { exact: false })).toBeVisible({ timeout: 20000 })
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    await attachScreenshot(testInfo, page, name)
    return {
      url: page.url(),
      status: response?.status(),
      title: await page.title(),
      canonical,
      viewport: viewport || page.viewportSize(),
    }
  } finally {
    await context.close()
  }
}

test.describe('Admin dashboard page publishing proof', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasE2ECredentials, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required.')
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')

  test('proves ADMIN CREATE -> DRAFT -> PREVIEW -> PUBLISH -> PUBLIC 200 -> EDIT -> REPUBLISH -> IMMEDIATE LIVE UPDATE', async ({ browser }, testInfo) => {
    test.setTimeout(300000)
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')
    expect(['staging', 'disposable']).toContain(destructiveCmsTestConfig.environment)
    if (destructiveCmsTestConfig.environment === 'staging') {
      expect(destructiveCmsTestConfig.targetProjectRef).toBe(destructiveCmsTestConfig.expectedProjectRef)
    }

    const supabase = createSupabaseAdminClient()
    const runId = Date.now()
    const initialBody = `${MARKER} unique visible test content ${runId} initial dashboard draft preview and publish proof.`
    const updatedBody = `${MARKER} unique visible test content ${runId} updated immediately after dashboard republish.`
    const seoDescription = `${MARKER} metadata description ${runId}`
    const evidence = {
      run_id: runId,
      base_url: E2E_BASE_URL,
      environment: destructiveCmsTestConfig.environment,
      staging_project_ref: destructiveCmsTestConfig.targetProjectRef,
      steps: [],
      api: {},
      database: {},
      public: {},
      screenshots: {},
    }
    const consoleErrors = []
    const apiErrors = []
    const cmsApiResponses = []
    const cmsApiResponsePromises = []
    let createdPageId = ''
    let prepared = null

    prepared = await prepareExactSlugForTest(supabase, evidence, runId)

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    adminPage.on('console', (message) => {
      if (message.type() !== 'error') return
      if (isBenignConsoleMessage(message.text())) return
      consoleErrors.push(message.text())
    })
    adminPage.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        apiErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`)
      }
      if (response.url().includes('/api/cms/')) {
        cmsApiResponsePromises.push(
          response.text().then((text) => {
            let body = null
            try {
              body = text ? JSON.parse(text) : null
            } catch {
              body = text
            }
            cmsApiResponses.push({
              status: response.status(),
              method: response.request().method(),
              url: response.url(),
              body,
            })
          }).catch(() => {
            cmsApiResponses.push({
              status: response.status(),
              method: response.request().method(),
              url: response.url(),
              body: null,
            })
          })
        )
      }
    })

    try {
      await loginAdmin(adminPage)
      evidence.steps.push('login')
      evidence.screenshots.before = await attachScreenshot(testInfo, adminPage, '01-admin-dashboard-before')

      await adminPage.goto('/admin/pages', { waitUntil: 'domcontentloaded' })
      await expect(adminPage.getByText('Visual Page Builder')).toBeVisible({ timeout: 30000 })
      await expect(adminPage.getByText('Syncing current website content...')).toHaveCount(0, { timeout: 30000 })
      await expect(adminPage.getByText('Loading pages...')).toHaveCount(0, { timeout: 30000 })
      await adminPage.getByRole('button', { name: 'New Page' }).click()

      // pressSequentially, not fill(): WebKit doesn't reliably fire the input events these
      // React-controlled fields' onChange depends on with fill() - see loginAdmin() in utils.js.
      await adminPage.locator('#page_title').pressSequentially(TITLE, { delay: 10 })
      await adminPage.locator('#page_slug').clear()
      await adminPage.locator('#page_slug').pressSequentially(INITIAL_SLUG, { delay: 10 })
      await adminPage.locator('#pagebuilder-page-description').pressSequentially(`${MARKER} standard page description ${runId}`, { delay: 10 })
      await adminPage.locator('#page_seo_title').pressSequentially(TITLE, { delay: 10 })
      await adminPage.locator('#page_canonical_url').pressSequentially(expectedCanonicalUrl(INITIAL_SLUG), { delay: 10 })
      await adminPage.locator('#pagebuilder-seo-description').pressSequentially(seoDescription, { delay: 10 })
      evidence.screenshots.admin_edit = await attachScreenshot(testInfo, adminPage, '02-admin-page-edit')

      const draftSave = await waitForPageApiResponse(adminPage, async () => {
        await adminPage.getByTestId('save-page-draft-button').click()
      })
      createdPageId = draftSave.json?.data?.id || ''
      expect(createdPageId).toBeTruthy()
      evidence.api.save_draft = draftSave.json
      evidence.steps.push('save draft')

      await expect(adminPage.getByRole('button', { name: 'Delete Page' })).toBeVisible({ timeout: 30000 })
      await expect(adminPage.getByText('Loading pages...')).toHaveCount(0, { timeout: 30000 })
      await expect.poll(async () => (await findPageById(supabase, createdPageId))?.status || '', { timeout: 15000 }).toBe('draft')
      evidence.database.draft = recordSummary(await findPageById(supabase, createdPageId))

      await adminPage.locator('#pagebuilder-heading').pressSequentially(TITLE, { delay: 10 })
      await adminPage.locator('#pagebuilder-subheading').pressSequentially(`${MARKER} staging preview subheading ${runId}`, { delay: 10 })
      await adminPage.locator('#pagebuilder-paragraph-text').pressSequentially(initialBody, { delay: 10 })
      await expect(adminPage.locator('#pagebuilder-heading')).toHaveValue(TITLE)
      await expect(adminPage.locator('#pagebuilder-paragraph-text')).toHaveValue(initialBody)
      await adminPage.getByRole('button', { name: 'Add Section', exact: true }).click()
      await expect(adminPage.getByText('Section added.')).toBeVisible({ timeout: 30000 })
      let createdSectionId = ''
      await expect.poll(async () => {
        const sections = await findSectionsForPage(supabase, createdPageId)
        createdSectionId = sections.find((section) => JSON.stringify(section.content_json || {}).includes(initialBody))?.id || ''
        return createdSectionId
      }, { timeout: 15000 }).not.toBe('')
      expect(createdSectionId).toBeTruthy()
      evidence.database.added_section = { id: createdSectionId }

      const draftPublic = await fetchPublic(`/${INITIAL_SLUG}`)
      evidence.public.draft_check = { status: draftPublic.status, exposedTitle: draftPublic.text.includes(TITLE), exposedContent: draftPublic.text.includes(initialBody) }
      expect(draftPublic.status).toBe(404)
      expect(draftPublic.text).not.toContain(TITLE)
      expect(draftPublic.text).not.toContain(initialBody)

      await adminPage.getByRole('button', { name: 'Preview Mode' }).click()
      await expect(adminPage.getByRole('button', { name: 'Edit Mode' })).toBeVisible()
      await expect(adminPage.getByRole('heading', { name: TITLE }).first()).toBeVisible()
      await expect(adminPage.getByText(initialBody, { exact: false }).first()).toBeVisible()
      evidence.screenshots.preview = await attachScreenshot(testInfo, adminPage, '03-admin-draft-preview')
      await adminPage.getByRole('button', { name: 'Edit Mode' }).click()
      evidence.steps.push('preview draft through admin')

      const publish = await waitForPageApiResponse(adminPage, async () => {
        await adminPage.getByTestId('publish-page-button').click()
      })
      evidence.api.publish = publish.json
      expect(publish.json?.publication?.canonical_public_url).toBe(expectedCanonicalUrl(INITIAL_SLUG))
      evidence.screenshots.publish = await attachScreenshot(testInfo, adminPage, '04-admin-after-publish')
      evidence.steps.push('publish')

      await expect.poll(async () => (await findPageById(supabase, createdPageId))?.status || '', { timeout: 15000 }).toBe('published')
      evidence.database.published = recordSummary(await findPageById(supabase, createdPageId))

      evidence.public.live_initial = await verifyLivePage(
        browser,
        `/${INITIAL_SLUG}`,
        TITLE,
        initialBody,
        testInfo,
        '05-live-after-publish-desktop'
      )
      const refreshContext = await browser.newContext()
      const refreshPage = await refreshContext.newPage()
      const refreshed = await refreshPage.goto(`/${INITIAL_SLUG}`, { waitUntil: 'domcontentloaded' })
      await refreshPage.reload({ waitUntil: 'domcontentloaded' })
      // See verifyLivePage() above: give client hydration a moment to settle
      // before asserting, to avoid catching a transient in-between paint.
      await refreshPage.waitForLoadState('networkidle').catch(() => {})
      await expect(refreshPage.getByText(initialBody, { exact: false })).toBeVisible({ timeout: 20000 })
      evidence.screenshots.refresh = await attachScreenshot(testInfo, refreshPage, '06-live-after-refresh')
      evidence.public.refresh_status = refreshed?.status()
      await refreshContext.close()

      await adminPage.getByTestId(`page-section-edit-${createdSectionId}`).click()
      await expect(adminPage.getByRole('button', { name: 'Update Section' })).toBeVisible({ timeout: 30000 })
      await adminPage.locator('#pagebuilder-paragraph-text').clear()
      await adminPage.locator('#pagebuilder-paragraph-text').pressSequentially(updatedBody, { delay: 10 })
      const sectionUpdate = await waitForSectionPatchApiResponse(adminPage, createdSectionId, async () => {
        await adminPage.getByRole('button', { name: 'Update Section' }).click()
      })
      evidence.api.section_update = sectionUpdate.json
      await expect(adminPage.getByText('Section updated.')).toBeVisible({ timeout: 30000 })
      const sectionsAfterAdminUpdate = await findSectionsForPage(supabase, createdPageId)
      evidence.database.section_after_admin_update = sectionsAfterAdminUpdate.map((section) => ({
        id: section.id,
        type: section.type,
        visibility: section.visibility,
        content_json: section.content_json,
        contains_updated_content: JSON.stringify(section.content_json || {}).includes(updatedBody),
      }))
      expect(
        evidence.database.section_after_admin_update.some((section) => section.contains_updated_content),
        JSON.stringify(evidence.database.section_after_admin_update)
      ).toBe(true)
      const republish = await waitForPageApiResponse(adminPage, async () => {
        await adminPage.getByTestId('publish-page-button').click()
      })
      evidence.api.republish_after_edit = republish.json
      expect(republish.json?.publication?.canonical_public_url).toBe(expectedCanonicalUrl(INITIAL_SLUG))
      evidence.steps.push('edit and republish')

      await expect.poll(async () => {
        const live = await fetchPublic(`/${INITIAL_SLUG}`)
        return live.text.includes(updatedBody)
      }, { timeout: 20000 }).toBe(true)
      evidence.public.live_updated = await verifyLivePage(
        browser,
        `/${INITIAL_SLUG}`,
        TITLE,
        updatedBody,
        testInfo,
        '07-live-after-content-update-desktop'
      )
      const sectionsAfterUpdate = await findSectionsForPage(supabase, createdPageId)
      evidence.database.updated_section = sectionsAfterUpdate.map((section) => ({
        id: section.id,
        type: section.type,
        visibility: section.visibility,
        contains_updated_content: JSON.stringify(section.content_json || {}).includes(updatedBody),
      }))
      expect(evidence.database.updated_section.some((section) => section.contains_updated_content)).toBe(true)

      await adminPage.locator('#page_slug').clear()
      await adminPage.locator('#page_slug').pressSequentially(UPDATED_SLUG, { delay: 10 })
      await adminPage.locator('#page_canonical_url').clear()
      await adminPage.locator('#page_canonical_url').pressSequentially(expectedCanonicalUrl(UPDATED_SLUG), { delay: 10 })
      const slugPublish = await waitForPageApiResponse(adminPage, async () => {
        await adminPage.getByTestId('publish-page-button').click()
      })
      evidence.api.publish_after_slug_change = slugPublish.json
      expect(slugPublish.json?.publication?.canonical_public_url).toBe(expectedCanonicalUrl(UPDATED_SLUG))

      const redirect = await fetchPublic(`/${INITIAL_SLUG}`)
      evidence.public.old_slug_redirect = redirect
      expect(redirect.status).toBe(301)
      // The redirect may be served either by middleware (which must emit an
      // absolute Location per the edge runtime's Response/Headers contract)
      // or by the page-level redirect() call (which emits a relative path).
      // Both are valid, standards-compliant redirects to the same
      // destination - compare on the resolved pathname, not the exact string.
      expect(new URL(redirect.location, E2E_BASE_URL).pathname).toBe(`/${UPDATED_SLUG}`)
      evidence.database.redirect = recordSummary(await findRedirect(supabase, `/${INITIAL_SLUG}`))

      evidence.public.live_after_slug_change = await verifyLivePage(
        browser,
        `/${UPDATED_SLUG}`,
        TITLE,
        updatedBody,
        testInfo,
        '08-live-new-slug-desktop'
      )

      const sitemap = await fetchPublic('/sitemap.xml')
      evidence.public.sitemap = {
        status: sitemap.status,
        contains_new_slug: sitemapHasExactPath(sitemap.text, `/${UPDATED_SLUG}`),
        contains_old_slug: sitemapHasExactPath(sitemap.text, `/${INITIAL_SLUG}`),
      }
      expect(sitemap.status).toBe(200)
      expect(evidence.public.sitemap.contains_new_slug).toBe(true)
      expect(evidence.public.sitemap.contains_old_slug).toBe(false)
      expect(evidence.public.live_after_slug_change.canonical).toBe(expectedCanonicalUrl(UPDATED_SLUG))

      evidence.public.tablet = await verifyLivePage(
        browser,
        `/${UPDATED_SLUG}`,
        TITLE,
        updatedBody,
        testInfo,
        '09-live-tablet',
        { width: 768, height: 1024 }
      )
      evidence.public.mobile = await verifyLivePage(
        browser,
        `/${UPDATED_SLUG}`,
        TITLE,
        updatedBody,
        testInfo,
        '10-live-mobile',
        { width: 390, height: 844 }
      )

      await adminPage.locator('#page_status').selectOption('draft')
      const unpublish = await waitForPageApiResponse(adminPage, async () => {
        await adminPage.getByTestId('save-page-draft-button').click()
      })
      evidence.api.unpublish = unpublish.json
      await expect.poll(async () => (await findPageById(supabase, createdPageId))?.status || '', { timeout: 15000 }).toBe('draft')
      const unpublished = await fetchPublic(`/${UPDATED_SLUG}`)
      evidence.public.unpublished_check = { status: unpublished.status, exposedContent: unpublished.text.includes(updatedBody) }
      expect(unpublished.status).toBe(404)
      expect(unpublished.text).not.toContain(updatedBody)

      const republishAgain = await waitForPageApiResponse(adminPage, async () => {
        await adminPage.getByTestId('publish-page-button').click()
      })
      evidence.api.republish_after_unpublish = republishAgain.json
      expect(republishAgain.json?.publication?.canonical_public_url).toBe(expectedCanonicalUrl(UPDATED_SLUG))
      evidence.public.live_after_republish = await verifyLivePage(
        browser,
        `/${UPDATED_SLUG}`,
        TITLE,
        updatedBody,
        testInfo,
        '11-live-after-republish'
      )

      evidence.database.final_before_cleanup = recordSummary(await findPageById(supabase, createdPageId))
      await Promise.all(cmsApiResponsePromises)
      evidence.api.cms_responses = cmsApiResponses
      expect(consoleErrors).toEqual([])
      expect(apiErrors).toEqual([])
    } finally {
      const cleanupErrors = []
      try {
        await adminContext.close()
      } catch (error) {
        cleanupErrors.push(`admin context close: ${error.message}`)
      }
      try {
        await cleanupCreatedPage(supabase, createdPageId, prepared?.baselineRedirectIds || [])
      } catch (error) {
        cleanupErrors.push(`cleanup e2e page: ${error.message}`)
      } finally {
        try {
          await restoreOriginalPage(supabase, prepared, evidence)
        } catch (error) {
          cleanupErrors.push(`restore original page: ${error.message}`)
        }
      }
      try {
        evidence.database.cleanup = {
          initial_slug: recordSummary(await findPageBySlug(supabase, INITIAL_SLUG)),
          updated_slug: recordSummary(await findPageBySlug(supabase, UPDATED_SLUG)),
          redirect: recordSummary(await findRedirect(supabase, `/${INITIAL_SLUG}`)),
        }
      } catch (error) {
        cleanupErrors.push(`cleanup verification: ${error.message}`)
      }
      if (cleanupErrors.length) evidence.cleanup_errors = cleanupErrors
      const evidencePath = testInfo.outputPath('cms-admin-page-publishing-evidence.json')
      fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2))
      await testInfo.attach('cms-admin-page-publishing-evidence', {
        path: evidencePath,
        contentType: 'application/json',
      })
    }
  })
})
