const { test, expect } = require('@playwright/test')
const {
  E2E_BASE_URL,
  createScopedCmsValue,
  createSupabaseAdminClient,
  destructiveCmsTestConfig,
  hasSupabaseAdminEnv,
} = require('./utils')

function absoluteUrl(pathname = '/') {
  return new URL(pathname, E2E_BASE_URL).toString()
}

async function fetchStatus(pathname) {
  const res = await fetch(absoluteUrl(pathname), { redirect: 'manual' })
  const body = await res.text()
  return { status: res.status, body }
}

test.describe('CMS previously-orphaned public modules (Companies, Internships, Banners, Popups, Forms)', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!hasSupabaseAdminEnv, 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')

  test.beforeEach(() => {
    test.skip(!destructiveCmsTestConfig.enabled, 'Destructive CMS E2E tests are blocked by the staging safety guard.')
  })

  test('company: create -> publish -> public 200 -> unpublish -> 404 -> republish -> 200', async () => {
    const supabase = createSupabaseAdminClient()
    const companyName = createScopedCmsValue('E2E Company')
    let id = ''
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({ company_name: companyName, description: 'E2E company', is_active: false })
        .select('*')
        .single()
      expect(error).toBeNull()
      id = data.id
      expect(data.slug).toBeTruthy()

      const draft = await fetchStatus(`/companies/${data.slug}`)
      expect(draft.status).toBe(404)

      await supabase.from('companies').update({ is_active: true }).eq('id', id)
      const live = await fetchStatus(`/companies/${data.slug}`)
      expect(live.status).toBe(200)
      expect(live.body).toContain(companyName)

      await supabase.from('companies').update({ is_active: false }).eq('id', id)
      const afterUnpublish = await fetchStatus(`/companies/${data.slug}`)
      expect(afterUnpublish.status).toBe(404)

      await supabase.from('companies').update({ is_active: true }).eq('id', id)
      const afterRepublish = await fetchStatus(`/companies/${data.slug}`)
      expect(afterRepublish.status).toBe(200)
    } finally {
      if (id) await supabase.from('companies').delete().eq('id', id)
    }
  })

  test('internship: create -> publish -> public 200 with exact role -> unpublish -> 404', async () => {
    const supabase = createSupabaseAdminClient()
    const role = createScopedCmsValue('E2E Internship Role')
    let id = ''
    try {
      const { data, error } = await supabase
        .from('internships')
        .insert({ company_name: 'E2E Co', role, description: 'E2E internship', is_active: false })
        .select('*')
        .single()
      expect(error).toBeNull()
      id = data.id
      expect(data.slug).toBeTruthy()

      const draft = await fetchStatus(`/internships/${data.slug}`)
      expect(draft.status).toBe(404)

      await supabase.from('internships').update({ is_active: true }).eq('id', id)
      const live = await fetchStatus(`/internships/${data.slug}`)
      expect(live.status).toBe(200)
      expect(live.body).toContain(role)

      const listing = await fetchStatus('/internships')
      expect(listing.body).toContain(role)

      await supabase.from('internships').update({ is_active: false }).eq('id', id)
      const afterUnpublish = await fetchStatus(`/internships/${data.slug}`)
      expect(afterUnpublish.status).toBe(404)
    } finally {
      if (id) await supabase.from('internships').delete().eq('id', id)
    }
  })

  test('banner: draft excluded from public API, published included, respects type filter', async () => {
    const supabase = createSupabaseAdminClient()
    const name = createScopedCmsValue('E2E Banner')
    let id = ''
    try {
      const { data, error } = await supabase
        .from('banners')
        .insert({ name, type: 'hero', title: name, status: 'draft', is_active: true })
        .select('*')
        .single()
      expect(error).toBeNull()
      id = data.id

      const draftListRes = await fetch(absoluteUrl('/api/cms/banners?type=hero'))
      const draftList = await draftListRes.json()
      expect(draftList.data.some((b) => b.id === id)).toBe(false)

      await supabase.from('banners').update({ status: 'published' }).eq('id', id)
      const liveListRes = await fetch(absoluteUrl('/api/cms/banners?type=hero'))
      const liveList = await liveListRes.json()
      expect(liveList.data.some((b) => b.id === id)).toBe(true)
    } finally {
      if (id) await supabase.from('banners').delete().eq('id', id)
    }
  })

  test('popup: draft excluded from public API, published included', async () => {
    const supabase = createSupabaseAdminClient()
    const name = createScopedCmsValue('E2E Popup')
    let id = ''
    try {
      const { data, error } = await supabase
        .from('popups')
        .insert({ name, trigger_type: 'immediate', content: 'E2E popup', status: 'draft', is_active: true })
        .select('*')
        .single()
      expect(error).toBeNull()
      id = data.id

      const draftListRes = await fetch(absoluteUrl('/api/cms/popups'))
      const draftList = await draftListRes.json()
      expect(draftList.data.some((p) => p.id === id)).toBe(false)

      await supabase.from('popups').update({ status: 'published' }).eq('id', id)
      const liveListRes = await fetch(absoluteUrl('/api/cms/popups'))
      const liveList = await liveListRes.json()
      expect(liveList.data.some((p) => p.id === id)).toBe(true)
    } finally {
      if (id) await supabase.from('popups').delete().eq('id', id)
    }
  })

  test('form: draft not publicly readable, published form accepts a real public submission', async () => {
    const supabase = createSupabaseAdminClient()
    const name = createScopedCmsValue('E2E Form')
    let id = ''
    try {
      const { data, error } = await supabase
        .from('forms')
        .insert({
          name,
          fields: [{ id: 'field-name', type: 'text', label: 'Name', required: true, options: [] }],
          status: 'draft',
        })
        .select('*')
        .single()
      expect(error).toBeNull()
      id = data.id

      const draftGet = await fetch(absoluteUrl(`/api/cms/forms/${id}`))
      expect(draftGet.status).toBe(404)

      await supabase.from('forms').update({ status: 'published' }).eq('id', id)
      const liveGet = await fetch(absoluteUrl(`/api/cms/forms/${id}`))
      expect(liveGet.status).toBe(200)

      const submitRes = await fetch(absoluteUrl(`/api/cms/forms/${id}/submit`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'field-name': 'E2E Submitter' }),
      })
      const submitJson = await submitRes.json()
      expect(submitRes.status).toBe(200)
      expect(submitJson.success).toBe(true)

      const { data: submissions } = await supabase.from('form_submissions').select('*').eq('form_id', id)
      expect(submissions?.length).toBe(1)
      await supabase.from('form_submissions').delete().eq('form_id', id)
    } finally {
      if (id) await supabase.from('forms').delete().eq('id', id)
    }
  })
})
