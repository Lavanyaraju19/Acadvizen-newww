import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  isAdminRequest,
  jsonError,
  jsonOk,
  normalizePagePath,
  parsePositiveInt,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const includeDrafts = searchParams.get('include_drafts') === '1' && isAdminRequest(request)
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
  if (!body?.title || !body?.slug) {
    return jsonError('title and slug are required.', 400)
  }

  const slug = String(body.slug).trim()

  // Ensure slug uniqueness
  const { data: existingSlug } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', slug)
    .neq('id', body.id || '')
    .single()

  if (existingSlug) {
    return jsonError('A page with this slug already exists', 400)
  }

  const payload = {
    id: body.id || undefined,
    title: String(body.title).trim(),
    slug,
    description: body.description || null,
    seo_title: body.seo_title || null,
    seo_description: body.seo_description || null,
    status: body.status === 'published' ? 'published' : 'draft',
    published_at: body.status === 'published' && !body.id ? new Date().toISOString() : body.published_at,
  }

  const { data, error } = await supabase
    .from('pages')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save page: ${error.message}`, 500)
  revalidateCmsPaths([normalizePagePath(data?.slug)])
  revalidateAllCmsPages()
  return jsonOk(data)
}
