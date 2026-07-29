import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  getOptionalAdminContext,
  jsonError,
  jsonOk,
  normalizePagePath,
  parsePositiveInt,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../_utils'
import { createSlugRedirectRecord } from '../../../../lib/redirects'
import { generateSlug, validateSlug } from '../../../../lib/slugUtils'

export const dynamic = 'force-dynamic'

const OPTIONAL_PAGE_COLUMNS = ['canonical_url', 'published_at']

function getMissingColumnName(error) {
  const message = String(error?.message || '')
  const match = message.match(/'([^']+)' column/i)
  return match?.[1] || ''
}

async function savePageRecord(supabase, payload) {
  let candidatePayload = { ...payload }

  while (true) {
    const attempt = await supabase
      .from('pages')
      .upsert(candidatePayload, { onConflict: 'id' })
      .select('*')
      .single()

    if (!attempt.error) {
      return attempt
    }

    const missingColumn = getMissingColumnName(attempt.error)
    if (!missingColumn || !OPTIONAL_PAGE_COLUMNS.includes(missingColumn) || !(missingColumn in candidatePayload)) {
      return attempt
    }

    delete candidatePayload[missingColumn]
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const wantsDrafts = searchParams.get('include_drafts') === '1'
  const adminAccess = wantsDrafts
    ? await getOptionalAdminContext(request, { resource: 'pages', action: 'read' })
    : { context: null, response: null }
  if (adminAccess.response) return adminAccess.response

  const includeDrafts = Boolean(adminAccess.context)
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
  if (response) return response

  const slug = searchParams.get('slug')
  const id = searchParams.get('id')
  const includeSections = searchParams.get('include_sections') === '1'
  const limit = parsePositiveInt(searchParams.get('limit'), 100)

  let query = supabase.from('pages').select('*').order('updated_at', { ascending: false }).limit(limit || 100)
  if (!includeDrafts) query = query.eq('status', 'published')
  if (slug) query = query.eq('slug', slug)
  if (id) query = query.eq('id', id)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])

  if (!includeSections) return jsonOk(data || [])
  const pageIds = (data || []).map((item) => item.id).filter(Boolean)
  if (!pageIds.length) return jsonOk((data || []).map((item) => ({ ...item, sections: [] })))

  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select('*')
    .in('page_id', pageIds)
    .order('order_index', { ascending: true })

  if (sectionsError) return jsonError(`Sections query failed: ${sectionsError.message}`, 500, data || [])

  const grouped = (sections || []).reduce((acc, section) => {
    if (!acc[section.page_id]) acc[section.page_id] = []
    acc[section.page_id].push(section)
    return acc
  }, {})

  return jsonOk((data || []).map((page) => ({ ...page, sections: grouped[page.id] || [] })))
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body?.title) {
    return jsonError('title is required.', 400)
  }

  const slug = generateSlug(body.slug || body.title)
  const slugValidation = validateSlug(slug)
  if (!slugValidation.valid) {
    return jsonError(slugValidation.error, 400)
  }

  const existingPageId = body.id || ''
  const { data: existingPage, error: existingPageError } = existingPageId
    ? await supabase.from('pages').select('*').eq('id', existingPageId).maybeSingle()
    : { data: null, error: null }

  if (existingPageError) {
    return jsonError(`Failed to load existing page: ${existingPageError.message}`, 500)
  }

  // Ensure slug uniqueness
  let existingSlugQuery = supabase
    .from('pages')
    .select('id')
    .eq('slug', slug)

  if (existingPageId) {
    existingSlugQuery = existingSlugQuery.neq('id', existingPageId)
  }

  const { data: existingSlug, error: existingSlugError } = await existingSlugQuery.maybeSingle()

  if (existingSlugError) {
    return jsonError(`Failed to validate page slug: ${existingSlugError.message}`, 500)
  }

  if (existingSlug) {
    return jsonError('A page with this slug already exists', 400)
  }

  const nextStatus = body.status === 'published' ? 'published' : 'draft'
  const payload = {
    id: existingPageId || undefined,
    title: String(body.title).trim(),
    slug,
    description: body.description || null,
    seo_title: body.seo_title || null,
    seo_description: body.seo_description || null,
    canonical_url: body.canonical_url || null,
    status: nextStatus,
    published_at:
      nextStatus === 'published'
        ? (existingPage?.published_at || body.published_at || new Date().toISOString())
        : null,
  }

  const { data, error } = await savePageRecord(supabase, payload)

  if (error) return jsonError(`Failed to save page: ${error.message}`, 500)

  let warning = null
  if (
    existingPage?.slug &&
    existingPage.slug !== data?.slug &&
    (existingPage.status === 'published' || data?.status === 'published')
  ) {
    try {
      await createSlugRedirectRecord(supabase, {
        fromPath: normalizePagePath(existingPage.slug),
        toPath: normalizePagePath(data?.slug),
        statusCode: 301,
      })
    } catch (redirectError) {
      warning = `Page saved, but the slug redirect could not be created: ${redirectError.message}`
    }
  }

  revalidateCmsPaths([normalizePagePath(existingPage?.slug), normalizePagePath(data?.slug), '/sitemap.xml'])
  revalidateAllCmsPages()
  return jsonOk(data, warning ? { warning } : {})
}
