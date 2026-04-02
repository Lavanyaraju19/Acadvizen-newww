import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Menu id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const update = {}
  const allowed = ['menu_location', 'title', 'url', 'order_index', 'parent_id', 'target', 'is_active']
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase.from('menus').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update menu item: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Menu id is required.', 400)

  const { error } = await supabase.from('menus').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete menu item: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk({ id, deleted: true })
}
