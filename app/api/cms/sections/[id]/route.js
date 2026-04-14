import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  normalizePagePath,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Section id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const update = {}
  const allowed = ['type', 'order_index', 'content_json', 'style_json', 'visibility', 'page_id']
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if ('visibility' in update) update.visibility = Boolean(update.visibility)
  if ('content_json' in update && (!update.content_json || typeof update.content_json !== 'object')) {
    update.content_json = {}
  }
  if ('style_json' in update && (!update.style_json || typeof update.style_json !== 'object')) {
    update.style_json = {}
  }

  const { data, error } = await supabase.from('sections').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update section: ${error.message}`, 200)
  const { data: page } = await supabase.from('pages').select('slug').eq('id', data?.page_id).maybeSingle()
  revalidateCmsPaths([normalizePagePath(page?.slug)])
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Section id is required.', 400)

  const { data: section } = await supabase.from('sections').select('page_id').eq('id', id).maybeSingle()
  const { error } = await supabase.from('sections').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete section: ${error.message}`, 200)
  const { data: page } = await supabase.from('pages').select('slug').eq('id', section?.page_id).maybeSingle()
  revalidateCmsPaths([normalizePagePath(page?.slug)])
  revalidateAllCmsPages()
  return jsonOk({ id, deleted: true })
}
