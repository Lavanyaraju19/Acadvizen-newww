import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateCmsPaths,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

function cityPagePath(slug = '') {
  const trimmed = String(slug || '').trim()
  return trimmed ? `/digital-marketing-course-in-${trimmed}` : null
}

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request, { resource: 'cities', action: 'update' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = await params
  if (!id) return jsonError('Section id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const update = {}
  const allowed = ['type', 'order_index', 'position', 'content_json', 'style_json', 'visibility']
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

  const { data, error } = await supabase.from('city_page_sections').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update section: ${error.message}`, 500)

  const { data: cityPage } = await supabase.from('city_pages').select('slug').eq('id', data?.city_page_id).maybeSingle()
  const path = cityPagePath(cityPage?.slug)
  if (path) revalidateCmsPaths([path])

  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request, { resource: 'cities', action: 'delete' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = await params
  if (!id) return jsonError('Section id is required.', 400)

  const { data: section } = await supabase.from('city_page_sections').select('city_page_id').eq('id', id).maybeSingle()
  const { error } = await supabase.from('city_page_sections').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete section: ${error.message}`, 500)

  const { data: cityPage } = await supabase.from('city_pages').select('slug').eq('id', section?.city_page_id).maybeSingle()
  const path = cityPagePath(cityPage?.slug)
  if (path) revalidateCmsPaths([path])

  return jsonOk({ id, deleted: true })
}
