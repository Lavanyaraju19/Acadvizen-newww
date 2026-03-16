import { ensureAdmin, getSupabaseClientOrResponse, jsonError, jsonOk, readJsonBody } from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const id = params?.id
  if (!id) return jsonError('Lead id is required.', 400)

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

  const update = {}
  if ('status' in body) {
    update.status = body.status === 'contacted' || body.status === 'qualified' || body.status === 'closed' ? body.status : 'new'
  }
  if ('payload' in body && body.payload && typeof body.payload === 'object') {
    update.payload = body.payload
  }
  if ('full_name' in body) update.full_name = body.full_name || null
  if ('email' in body) update.email = body.email || null
  if ('phone' in body) update.phone = body.phone || null

  if (!Object.keys(update).length) return jsonError('No valid fields to update.', 400)

  const { data, error } = await supabase.from('leads').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update lead: ${error.message}`, 200)
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const id = params?.id
  if (!id) return jsonError('Lead id is required.', 400)

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete lead: ${error.message}`, 200)
  return jsonOk({ id, deleted: true })
}
