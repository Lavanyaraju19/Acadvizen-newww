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
  const { supabase, response } = await getSupabaseClientOrResponse(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const includeDrafts = searchParams.get('include_drafts') === 'true'

  let query = supabase
    .from('homepage_placements')
    .select('*')
    .order('order_index', { ascending: true })

  if (!includeDrafts) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) return jsonError(`Failed to fetch placements: ${error.message}`, 500)

  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  // Use actual DB column names: company_name, logo_url, student_name, role, testimonial
  const payload = {
    company_name: String(body.company_name || '').trim(),
    logo_url: body.logo_url || body.logo || null,
    student_name: body.student_name || null,
    role: body.role || null,
    testimonial: body.testimonial || body.student_image || null,
    order_index: Number(body.order_index) || 0,
    is_active: body.is_active !== false,
  }

  const { data, error } = await supabase
    .from('homepage_placements')
    .insert(payload)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create placement: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function PATCH(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  if (!body.id) {
    return jsonError('Missing required field: id', 400)
  }

  const payload = {
    company_name: body.company_name !== undefined ? String(body.company_name).trim() : undefined,
    logo_url: body.logo_url !== undefined ? body.logo_url : (body.logo !== undefined ? body.logo : undefined),
    student_name: body.student_name !== undefined ? body.student_name : undefined,
    role: body.role !== undefined ? body.role : undefined,
    testimonial: body.testimonial !== undefined ? body.testimonial : (body.student_image !== undefined ? body.student_image : undefined),
    order_index: body.order_index !== undefined ? Number(body.order_index) : undefined,
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
  }

  // Remove undefined values
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

  const { data, error } = await supabase
    .from('homepage_placements')
    .update(payload)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update placement: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  if (!body.id) {
    return jsonError('Missing required field: id', 400)
  }

  const { error } = await supabase
    .from('homepage_placements')
    .delete()
    .eq('id', body.id)

  if (error) return jsonError(`Failed to delete placement: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk({ success: true })
}
