const { test, expect } = require('@playwright/test')
const {
  assertDestructiveCmsTestsAllowed,
  createScopedCmsValue,
} = require('./safety')
const {
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
} = require('./utils')
const {
  createRoleSession,
  deleteDisposableRoleUser,
  probeAuthUserProvisioning,
} = require('./rbac-utils')

async function readJson(response) {
  return response.json().catch(() => null)
}

test.describe('CMS direct API permissions', () => {
  test.describe.configure({ mode: 'serial' })

  const shouldRun = destructiveCmsTestConfig.enabled
  let blockReason = shouldRun ? '' : 'Destructive staging RBAC checks require the staging safety gate to pass.'
  /** @type {Array<{id:string,email:string,roleSlug:string,headers:Record<string,string>}>} */
  const sessions = []
  /** @type {Array<{id:string, slug:string}>} */
  const blogsToCleanup = []

  test.beforeEach(() => {
    if (blockReason) {
      test.skip(blockReason)
    }
  })

  test.beforeAll(async () => {
    if (!shouldRun) {
      return
    }

    assertDestructiveCmsTestsAllowed()
    const provisioningProbe = await probeAuthUserProvisioning()
    if (!provisioningProbe.ok) {
      blockReason =
        'Disposable RBAC account provisioning is blocked in the staging Supabase project. ' +
        `Current probe result: ${provisioningProbe.errorName || 'Error'} ${provisioningProbe.errorStatus || ''} ${provisioningProbe.reason}. ` +
        'Apply supabase/migrations/20260729_zzz_auth_profile_trigger_fix.sql to staging and rerun this suite.'
      return
    }

    sessions.push(await createRoleSession('super_admin'))
    sessions.push(await createRoleSession('admin'))
    sessions.push(await createRoleSession('editor'))
    sessions.push(await createRoleSession('author'))
    sessions.push(await createRoleSession('author'))
    sessions.push(await createRoleSession('reviewer'))
    sessions.push(await createRoleSession('viewer'))
  })

  test.afterAll(async () => {
    const supabase = createSupabaseAdminClient()
    for (const blog of blogsToCleanup) {
      await supabase.from('blog_content_blocks').delete().eq('blog_id', blog.id)
      await supabase.from('blogs').delete().eq('id', blog.id)
    }

    for (const session of sessions.reverse()) {
      await deleteDisposableRoleUser(session.id).catch(() => null)
    }
  })

  function getSession(roleSlug, index = 0) {
    return sessions.filter((session) => session.roleSlug === roleSlug)[index]
  }

  test('rejects unauthenticated access to protected CMS APIs', async ({ request }) => {
    const routes = [
      '/api/cms/users',
      '/api/cms/media',
      '/api/cms/leads',
      '/api/cms/entities/pages/test-id',
    ]

    for (const route of routes) {
      const response = await request.get(route)
      expect([401, 403]).toContain(response.status())
    }
  })

  test('enforces read-only viewer access and blocks privileged routes', async ({ request }) => {
    const viewer = getSession('viewer')

    const draftReadResponse = await request.get('/api/cms/pages?include_drafts=1&limit=5', {
      headers: viewer.headers,
    })
    expect(draftReadResponse.status()).toBe(200)

    const mediaReadResponse = await request.get('/api/cms/media?limit=5', {
      headers: viewer.headers,
    })
    expect(mediaReadResponse.status()).toBe(200)

    const usersResponse = await request.get('/api/cms/users?limit=5', {
      headers: viewer.headers,
    })
    expect(usersResponse.status()).toBe(403)

    const createPageResponse = await request.post('/api/cms/pages', {
      headers: viewer.headers,
      data: {
        title: createScopedCmsValue('viewer-page'),
        slug: createScopedCmsValue('viewer-page'),
        description: 'Viewer should not be allowed to create pages.',
        status: 'draft',
      },
    })
    expect(createPageResponse.status()).toBe(403)
  })

  test('allows an author to edit only their own draft and blocks direct publishing', async ({ request }) => {
    const author = getSession('author', 0)
    const otherAuthor = getSession('author', 1)
    const draftTitle = createScopedCmsValue('author-blog')
    const draftSlug = createScopedCmsValue('author-blog')

    const createDraftResponse = await request.post('/api/cms/blogs', {
      headers: author.headers,
      data: {
        title: draftTitle,
        slug: draftSlug,
        description: 'Disposable RBAC draft.',
        content: 'Author-owned draft content.',
        status: 'draft',
      },
    })
    expect(createDraftResponse.status()).toBe(200)
    const createdDraftPayload = await readJson(createDraftResponse)
    const createdDraft = createdDraftPayload?.data
    expect(createdDraft?.id).toBeTruthy()
    expect(createdDraft?.author_id).toBe(author.id)
    blogsToCleanup.push({ id: createdDraft.id, slug: createdDraft.slug })

    const ownUpdateResponse = await request.patch(`/api/cms/blogs/${createdDraft.id}`, {
      headers: author.headers,
      data: {
        title: `${draftTitle} Updated`,
        content: 'Updated by the owning author.',
      },
    })
    expect(ownUpdateResponse.status()).toBe(200)

    const publishResponse = await request.patch(`/api/cms/blogs/${createdDraft.id}`, {
      headers: author.headers,
      data: {
        status: 'published',
      },
    })
    expect(publishResponse.status()).toBe(403)

    const forbiddenUpdateResponse = await request.patch(`/api/cms/blogs/${createdDraft.id}`, {
      headers: otherAuthor.headers,
      data: {
        title: 'Should be rejected',
      },
    })
    expect(forbiddenUpdateResponse.status()).toBe(403)

    const supabase = createSupabaseAdminClient()
    const { data: storedDraft } = await supabase
      .from('blogs')
      .select('id,title,status,author_id')
      .eq('id', createdDraft.id)
      .single()

    expect(storedDraft?.title).toBe(`${draftTitle} Updated`)
    expect(storedDraft?.status).toBe('draft')
    expect(storedDraft?.author_id).toBe(author.id)
  })

  test('allows an editor to publish content but still blocks user management', async ({ request }) => {
    const editor = getSession('editor')
    const draftTitle = createScopedCmsValue('editor-blog')
    const draftSlug = createScopedCmsValue('editor-blog')

    const createDraftResponse = await request.post('/api/cms/blogs', {
      headers: editor.headers,
      data: {
        title: draftTitle,
        slug: draftSlug,
        description: 'Editor-owned draft.',
        content: 'Editor content.',
        status: 'draft',
      },
    })
    expect(createDraftResponse.status()).toBe(200)
    const createdDraftPayload = await readJson(createDraftResponse)
    const createdDraft = createdDraftPayload?.data
    expect(createdDraft?.id).toBeTruthy()
    blogsToCleanup.push({ id: createdDraft.id, slug: createdDraft.slug })

    const publishResponse = await request.patch(`/api/cms/blogs/${createdDraft.id}`, {
      headers: editor.headers,
      data: {
        status: 'published',
      },
    })
    expect(publishResponse.status()).toBe(200)

    const usersResponse = await request.get('/api/cms/users?limit=5', {
      headers: editor.headers,
    })
    expect(usersResponse.status()).toBe(403)
  })

  test('allows admins and super admins to manage users while protecting lower roles', async ({ request }) => {
    const admin = getSession('admin')
    const superAdmin = getSession('super_admin')
    const viewer = getSession('viewer')
    const reviewer = getSession('reviewer')

    const viewerUsersResponse = await request.get('/api/cms/users?limit=5', {
      headers: viewer.headers,
    })
    expect(viewerUsersResponse.status()).toBe(403)

    const adminUsersResponse = await request.get('/api/cms/users?limit=5', {
      headers: admin.headers,
    })
    expect(adminUsersResponse.status()).toBe(200)

    const superAdminUsersResponse = await request.get('/api/cms/users?limit=5', {
      headers: superAdmin.headers,
    })
    expect(superAdminUsersResponse.status()).toBe(200)

    const viewerPromoteResponse = await request.patch(`/api/cms/users/${reviewer.id}`, {
      headers: viewer.headers,
      data: {
        role: 'admin',
      },
    })
    expect(viewerPromoteResponse.status()).toBe(403)

    const adminRoleUpdateResponse = await request.patch(`/api/cms/users/${reviewer.id}`, {
      headers: admin.headers,
      data: {
        role: 'viewer',
      },
    })
    expect(adminRoleUpdateResponse.status()).toBe(200)

    const supabase = createSupabaseAdminClient()
    const { data: updatedReviewer } = await supabase
      .from('profiles')
      .select('id,role')
      .eq('id', reviewer.id)
      .single()

    expect(updatedReviewer?.role).toBe('viewer')
  })
})
