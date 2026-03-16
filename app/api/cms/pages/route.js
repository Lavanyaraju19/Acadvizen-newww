import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  isAdminRequest,
  jsonError,
  jsonOk,
  parsePositiveInt,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')
  const includeSections = searchParams.get('include_sections') === '1'
  const includeDrafts = searchParams.get('include_drafts') === '1' && isAdminRequest(request)
  const limit = parsePositiveInt(searchParams.get('limit'), 100)

  let query = supabase.from('pages').select('*').order('updated_at', { ascending: false }).limit(limit || 100)
  if (!includeDrafts) query = query.eq('status', 'published')
  if (slug) query = query.eq('slug', slug)
  if (id) query = query.eq('id', id)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 200, [])

  if (!includeSections) return jsonOk(data || [])
  const pageIds = (data || []).map((item) => item.id).filter(Boolean)
  if (!pageIds.length) return jsonOk((data || []).map((item) => ({ ...item, sections: [] })))

  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select('*')
    .in('page_id', pageIds)
    .order('order_index', { ascending: true })

  if (sectionsError) return jsonError(`Sections query failed: ${sectionsError.message}`, 200, data || [])

  const grouped = (sections || []).reduce((acc, section) => {
    if (!acc[section.page_id]) acc[section.page_id] = []
    acc[section.page_id].push(section)
    return acc
  }, {})

  return jsonOk((data || []).map((page) => ({ ...page, sections: grouped[page.id] || [] })))
}

export async function POST(request) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const body = await readJsonBody(request)
  if (!body?.title || !body?.slug) {
    return jsonError('title and slug are required.', 400)
  }

  const payload = {
    id: body.id || undefined,
    title: String(body.title).trim(),
    slug: String(body.slug).trim(),
    description: body.description || null,
    seo_title: body.seo_title || null,
    seo_description: body.seo_description || null,
    status: body.status === 'published' ? 'published' : 'draft',
  }

  const { data, error } = await supabase
    .from('pages')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save page: ${error.message}`, 200)
  return jsonOk(data)
}
