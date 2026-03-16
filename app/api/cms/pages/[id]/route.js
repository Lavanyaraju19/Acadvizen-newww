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
  if (!id) return jsonError('Page id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const update = {}
  const allowed = ['title', 'slug', 'description', 'seo_title', 'seo_description', 'status']
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if ('status' in update) {
    update.status = update.status === 'published' ? 'published' : 'draft'
  }

  const { data, error } = await supabase.from('pages').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update page: ${error.message}`, 200)
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Page id is required.', 400)

  const { error } = await supabase.from('pages').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete page: ${error.message}`, 200)
  return jsonOk({ id, deleted: true })
}
