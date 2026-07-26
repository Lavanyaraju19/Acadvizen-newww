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
    .from('homepage_partners')
    .select('*')
    .order('order_index', { ascending: true })

  if (!includeDrafts) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) return jsonError(`Failed to fetch partners: ${error.message}`, 500)

  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  const payload = {
    name: String(body.name || '').trim(),
    logo: body.logo || null,
    website: body.website || null,
    order_index: Number(body.order_index) || 0,
    is_active: body.is_active !== false,
  }

  const { data, error } = await supabase
    .from('homepage_partners')
    .insert(payload)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create partner: ${error.message}`, 500)

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
    logo: body.logo !== undefined ? body.logo : undefined,
    website: body.website !== undefined ? body.website : undefined,
    order_index: body.order_index !== undefined ? Number(body.order_index) : undefined,
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
  }

  // Remove undefined values
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

  const { data, error } = await supabase
    .from('homepage_partners')
    .update(payload)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update partner: ${error.message}`, 500)

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
    .from('homepage_partners')
    .delete()
    .eq('id', body.id)

  if (error) return jsonError(`Failed to delete partner: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk({ success: true })
}
