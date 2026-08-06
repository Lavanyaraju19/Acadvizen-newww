import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  parsePositiveInt,
  revalidateAllCmsPages,
  readJsonBody,
} from '../../_utils'
import { wouldCreateMenuCycle } from '../../../../../lib/menuTree'

export const dynamic = 'force-dynamic'

// Bulk reorder/re-parent for drag-and-drop: body is { menu_location, items: [{ id, order_index,
// parent_id }] }. Every move is validated against the FULL resulting tree before anything is
// written, so a drag that would create a cycle or exceed the nesting limit is rejected as a
// whole rather than partially applied.
export async function PATCH(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const menuLocation = body?.menu_location
  const items = Array.isArray(body?.items) ? body.items : []
  if (!menuLocation) return jsonError('menu_location is required.', 400)
  if (!items.length) return jsonError('items is required and must be a non-empty array.', 400)
  for (const item of items) {
    if (!item?.id) return jsonError('Every item requires an id.', 400)
  }

  const { data: currentRows, error: currentError } = await supabase
    .from('menus')
    .select('id, parent_id, menu_location')
    .eq('menu_location', menuLocation)
  if (currentError) return jsonError(`Failed to load menu for validation: ${currentError.message}`, 500)

  const currentIds = new Set((currentRows || []).map((row) => row.id))
  for (const item of items) {
    if (!currentIds.has(item.id)) {
      return jsonError(`Menu item ${item.id} does not belong to menu "${menuLocation}".`, 400)
    }
  }

  const proposedById = new Map((currentRows || []).map((row) => [row.id, { ...row }]))
  items.forEach((item) => {
    const row = proposedById.get(item.id)
    if (!row) return
    row.parent_id = 'parent_id' in item ? (item.parent_id || null) : row.parent_id
  })
  const proposedRows = Array.from(proposedById.values())

  for (const item of items) {
    if (!('parent_id' in item) || !item.parent_id) continue
    if (item.parent_id === item.id) {
      return jsonError('A menu item cannot be its own parent.', 400)
    }
    if (!currentIds.has(item.parent_id)) {
      return jsonError('The selected parent menu item was not found in this menu.', 400)
    }
    if (wouldCreateMenuCycle(proposedRows, item.id, item.parent_id)) {
      return jsonError('That move would create a circular menu, or nest too deeply.', 400)
    }
  }

  const updates = items.map((item) => {
    const update = { order_index: parsePositiveInt(item.order_index, 0) }
    if ('parent_id' in item) update.parent_id = item.parent_id || null
    return supabase.from('menus').update(update).eq('id', item.id)
  })

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)
  if (failed?.error) return jsonError(`Failed to reorder menu: ${failed.error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk({ menu_location: menuLocation, updated: items.length })
}
