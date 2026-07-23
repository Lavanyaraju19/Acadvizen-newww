import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PUT(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await request.json()
  const { id } = params

  // Check for redirect loops
  if (body.old_url === body.new_url) {
    return jsonError('Cannot redirect to the same URL', 400)
  }

  // Check if old_url already exists (excluding current)
  if (body.old_url) {
    const { data: existing } = await supabase
      .from('redirects')
      .select('id')
      .eq('old_url', body.old_url)
      .neq('id', id)
      .single()

    if (existing) {
      return jsonError('A redirect for this old URL already exists', 400)
    }
  }

  const { data, error } = await supabase
    .from('redirects')
    .update({
      old_url: body.old_url,
      new_url: body.new_url,
      redirect_type: body.redirect_type,
      is_active: body.is_active,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update redirect: ${error.message}`, 200)
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  const { error } = await supabase
    .from('redirects')
    .delete()
    .eq('id', id)

  if (error) return jsonError(`Failed to delete redirect: ${error.message}`, 200)
  return jsonOk({ success: true })
}