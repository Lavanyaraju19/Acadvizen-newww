import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
  readJsonBody,
} from '../../_utils'
import { isValidNavUrl } from '../../../../../lib/linkValidation'
import { wouldCreateMenuCycle } from '../../../../../lib/menuTree'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Menu id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  if ('title' in body && !String(body.title || '').trim()) {
    return jsonError('Menu label is required.', 400)
  }
  if ('url' in body) {
    if (!String(body.url || '').trim()) return jsonError('A destination (URL) is required.', 400)
    if (!isValidNavUrl(body.url)) {
      return jsonError('Enter a valid destination - a path starting with / or a full https:// URL.', 400)
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from('menus')
    .select('id, menu_location')
    .eq('id', id)
    .single()
  if (existingError || !existing) return jsonError('Menu item not found.', 404)

  if ('parent_id' in body) {
    const parentId = body.parent_id || null
    if (parentId === id) {
      return jsonError('A menu item cannot be its own parent.', 400)
    }
    if (parentId) {
      const { data: siblings, error: siblingsError } = await supabase
        .from('menus')
        .select('id, parent_id, menu_location')
        .eq('menu_location', existing.menu_location)
      if (siblingsError) return jsonError(`Failed to validate menu hierarchy: ${siblingsError.message}`, 500)

      const parentRow = siblings?.find((row) => row.id === parentId)
      if (!parentRow) {
        return jsonError('The selected parent menu item was not found in this menu.', 400)
      }
      if (wouldCreateMenuCycle(siblings, id, parentId)) {
        return jsonError('That parent would create a circular menu, or nest too deeply.', 400)
      }
    }
  }

  const update = {}
  const allowed = [
    'menu_location', 'title', 'url', 'order_index', 'parent_id', 'target', 'is_active',
    'icon', 'description', 'desktop_visible', 'mobile_visible', 'status',
  ]
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if ('title' in update) update.title = String(update.title).trim()
  if ('url' in update) update.url = String(update.url).trim()
  if ('target' in update) update.target = update.target === '_blank' ? '_blank' : '_self'
  if ('icon' in update) update.icon = update.icon ? String(update.icon).trim().slice(0, 50) : null
  if ('description' in update) update.description = update.description ? String(update.description).trim().slice(0, 300) : null
  if ('status' in update) update.status = update.status === 'draft' ? 'draft' : 'published'

  const { data, error } = await supabase.from('menus').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update menu item: ${error.message}`, 500)
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Menu id is required.', 400)

  const { error } = await supabase.from('menus').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete menu item: ${error.message}`, 500)
  revalidateAllCmsPages()
  return jsonOk({ id, deleted: true })
}
