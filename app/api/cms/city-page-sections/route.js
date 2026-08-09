import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  getOptionalAdminContext,
  jsonError,
  jsonOk,
  parsePositiveInt,
  revalidateCmsPaths,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

function cityPagePath(slug = '') {
  const trimmed = String(slug || '').trim()
  return trimmed ? `/digital-marketing-course-in-${trimmed}` : null
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const wantsHidden = searchParams.get('include_hidden') === '1'
  const adminAccess = wantsHidden
    ? await getOptionalAdminContext(request, { resource: 'cities', action: 'read' })
    : { context: null, response: null }
  if (adminAccess.response) return adminAccess.response

  const includeHidden = Boolean(adminAccess.context)
  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: includeHidden })
  if (response) return response

  const cityPageId = searchParams.get('city_page_id')
  if (!cityPageId) return jsonError('city_page_id is required.', 400)

  let query = supabase
    .from('city_page_sections')
    .select('*')
    .eq('city_page_id', cityPageId)
    .order('order_index', { ascending: true })
    .limit(200)
  if (!includeHidden) query = query.eq('visibility', true)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request, { resource: 'cities', action: 'create' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  if (!body.city_page_id || !body.type) {
    return jsonError('city_page_id and type are required.', 400)
  }

  const payload = {
    city_page_id: body.city_page_id,
    type: body.type,
    order_index: parsePositiveInt(body.order_index, 0),
    position: typeof body.position === 'string' && body.position ? body.position : 'end',
    content_json: body.content_json && typeof body.content_json === 'object' ? body.content_json : {},
    style_json: body.style_json && typeof body.style_json === 'object' ? body.style_json : {},
    visibility: body.visibility !== false,
  }

  const { data, error } = await supabase.from('city_page_sections').insert(payload).select('*').single()
  if (error) return jsonError(`Failed to create section: ${error.message}`, 500)

  const { data: cityPage } = await supabase.from('city_pages').select('slug').eq('id', payload.city_page_id).maybeSingle()
  const path = cityPagePath(cityPage?.slug)
  if (path) revalidateCmsPaths([path])

  return jsonOk(data)
}
