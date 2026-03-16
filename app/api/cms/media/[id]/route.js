import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Media id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const update = {}
  const allowed = ['url', 'bucket', 'path', 'type', 'width', 'height', 'size', 'alt_text', 'caption']
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase.from('media').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update media: ${error.message}`, 200)
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Media id is required.', 400)

  const { error } = await supabase.from('media').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete media metadata: ${error.message}`, 200)
  return jsonOk({ id, deleted: true })
}
