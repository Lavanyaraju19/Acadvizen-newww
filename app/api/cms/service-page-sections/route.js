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

function servicePagePath(slug = '') {
  const trimmed = String(slug || '').trim()
  return trimmed ? `/${trimmed}` : null
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const wantsHidden = searchParams.get('include_hidden') === '1'
  const adminAccess = wantsHidden
    ? await getOptionalAdminContext(request, { resource: 'service_pages', action: 'read' })
    : { context: null, response: null }
  if (adminAccess.response) return adminAccess.response

  const includeHidden = Boolean(adminAccess.context)
  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: includeHidden })
  if (response) return response

  const servicePageId = searchParams.get('service_page_id')
  if (!servicePageId) return jsonError('service_page_id is required.', 400)

  let query = supabase
    .from('service_page_sections')
    .select('*')
    .eq('service_page_id', servicePageId)
    .order('order_index', { ascending: true })
    .limit(200)
  if (!includeHidden) query = query.eq('visibility', true)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request, { resource: 'service_pages', action: 'create' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  if (!body.service_page_id || !body.type) {
    return jsonError('service_page_id and type are required.', 400)
  }

  const payload = {
    service_page_id: body.service_page_id,
    type: body.type,
    order_index: parsePositiveInt(body.order_index, 0),
    position: typeof body.position === 'string' && body.position ? body.position : 'end',
    content_json: body.content_json && typeof body.content_json === 'object' ? body.content_json : {},
    style_json: body.style_json && typeof body.style_json === 'object' ? body.style_json : {},
    visibility: body.visibility !== false,
  }

  const { data, error } = await supabase.from('service_page_sections').insert(payload).select('*').single()
  if (error) return jsonError(`Failed to create section: ${error.message}`, 500)

  const { data: servicePage } = await supabase.from('service_pages').select('slug').eq('id', payload.service_page_id).maybeSingle()
  const path = servicePagePath(servicePage?.slug)
  if (path) revalidateCmsPaths([path])

  return jsonOk(data)
}
