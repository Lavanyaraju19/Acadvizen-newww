import { ensureAdmin, getSupabaseClientOrResponse, jsonError, jsonOk, readJsonBody } from '../../_utils'

export const dynamic = 'force-dynamic'

function removeMissingColumn(update, column) {
  if (!column || !(column in update)) return update
  const next = { ...update }
  delete next[column]
  return next
}

async function updateLeadWithSchemaFallback(supabase, id, update) {
  let nextUpdate = { ...update }
  let lastError = null

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await supabase.from('leads').update(nextUpdate).eq('id', id).select('*').single()
    if (!result.error) return result

    lastError = result.error
    const missingColumnMatch = result.error.message?.match(/Could not find the '([^']+)' column/i)
    const missingColumn = missingColumnMatch?.[1]
    if (!missingColumn || !(missingColumn in nextUpdate)) return result

    nextUpdate = removeMissingColumn(nextUpdate, missingColumn)
  }

  return {
    data: null,
    error: lastError || { message: 'Lead update failed after schema fallback attempts.' },
  }
}

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const id = params?.id
  if (!id) return jsonError('Lead id is required.', 400)

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
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

  const { data, error } = await updateLeadWithSchemaFallback(supabase, id, update)
  if (error) return jsonError(`Failed to update lead: ${error.message}`, 200)
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const id = params?.id
  if (!id) return jsonError('Lead id is required.', 400)

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete lead: ${error.message}`, 200)
  return jsonOk({ id, deleted: true })
}
