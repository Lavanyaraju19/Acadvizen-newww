import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { supabase, response } = getSupabaseClientOrResponse(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const includeDrafts = searchParams.get('include_drafts') === 'true'

  let query = supabase
    .from('homepage_tools')
    .select('*')
    .order('order_index', { ascending: true })

  if (!includeDrafts) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) return jsonError(`Failed to fetch tools: ${error.message}`, 500)

  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  // Use actual DB column names: name, logo_url, description, category, link, order_index, is_active
  const payload = {
    name: String(body.name || '').trim(),
    logo_url: body.logo_url || body.icon || null,
    description: String(body.description || '').trim() || null,
    category: body.category || null,
    link: body.link || null,
    order_index: Number(body.order_index) || 0,
    is_active: body.is_active !== false,
  }

  const { data, error } = await supabase
    .from('homepage_tools')
    .insert(payload)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create tool: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function PATCH(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  if (!body.id) {
    return jsonError('Missing required field: id', 400)
  }

  const payload = {
    name: body.name !== undefined ? String(body.name).trim() : undefined,
    logo_url: body.logo_url !== undefined ? body.logo_url : (body.icon !== undefined ? body.icon : undefined),
    description: body.description !== undefined ? String(body.description).trim() : undefined,
    category: body.category !== undefined ? body.category : undefined,
    link: body.link !== undefined ? body.link : undefined,
    order_index: body.order_index !== undefined ? Number(body.order_index) : undefined,
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
  }

  // Remove undefined values
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

  const { data, error } = await supabase
    .from('homepage_tools')
    .update(payload)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update tool: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  if (!body.id) {
    return jsonError('Missing required field: id', 400)
  }

  const { error } = await supabase
    .from('homepage_tools')
    .delete()
    .eq('id', body.id)

  if (error) return jsonError(`Failed to delete tool: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk({ success: true })
}
