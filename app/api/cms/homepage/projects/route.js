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
    .from('homepage_projects')
    .select('*')
    .order('order_index', { ascending: true })

  if (!includeDrafts) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) return jsonError(`Failed to fetch projects: ${error.message}`, 500)

  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  // Use actual DB column names: title, description, image_url, link, order_index, is_active
  const payload = {
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    image_url: body.image_url || body.image || null,
    link: body.link || null,
    order_index: Number(body.order_index) || 0,
    is_active: body.is_active !== false,
  }

  const { data, error } = await supabase
    .from('homepage_projects')
    .insert(payload)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create project: ${error.message}`, 500)

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
    title: body.title !== undefined ? String(body.title).trim() : undefined,
    description: body.description !== undefined ? String(body.description).trim() : undefined,
    image_url: body.image_url !== undefined ? body.image_url : (body.image !== undefined ? body.image : undefined),
    link: body.link !== undefined ? body.link : undefined,
    order_index: body.order_index !== undefined ? Number(body.order_index) : undefined,
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
  }

  // Remove undefined values
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

  const { data, error } = await supabase
    .from('homepage_projects')
    .update(payload)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update project: ${error.message}`, 500)

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
    .from('homepage_projects')
    .delete()
    .eq('id', body.id)

  if (error) return jsonError(`Failed to delete project: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk({ success: true })
}
