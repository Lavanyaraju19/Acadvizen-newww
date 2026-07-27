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
    .from('homepage_testimonials')
    .select('*')
    .order('order_index', { ascending: true })

  if (!includeDrafts) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) return jsonError(`Failed to fetch testimonials: ${error.message}`, 500)

  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  // Use actual DB column names: name, role, company, quote, image_url, rating
  const payload = {
    name: String(body.name || '').trim(),
    role: String(body.role || '').trim() || null,
    company: body.company || null,
    quote: body.quote || body.content || null,
    image_url: body.image_url || body.image || null,
    rating: Number(body.rating) || 5,
    order_index: Number(body.order_index) || 0,
    is_active: body.is_active !== false,
  }

  const { data, error } = await supabase
    .from('homepage_testimonials')
    .insert(payload)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create testimonial: ${error.message}`, 500)

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
    role: body.role !== undefined ? String(body.role).trim() : (body.role !== undefined ? body.role : undefined),
    company: body.company !== undefined ? body.company : undefined,
    quote: body.quote !== undefined ? body.quote : (body.content !== undefined ? body.content : undefined),
    image_url: body.image_url !== undefined ? body.image_url : (body.image !== undefined ? body.image : undefined),
    rating: body.rating !== undefined ? Number(body.rating) : undefined,
    order_index: body.order_index !== undefined ? Number(body.order_index) : undefined,
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
  }

  // Remove undefined values
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

  const { data, error } = await supabase
    .from('homepage_testimonials')
    .update(payload)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update testimonial: ${error.message}`, 500)

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
    .from('homepage_testimonials')
    .delete()
    .eq('id', body.id)

  if (error) return jsonError(`Failed to delete testimonial: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk({ success: true })
}
