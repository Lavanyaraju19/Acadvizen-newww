import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  getOptionalAdminContext,
  jsonError,
  jsonOk,
  parsePositiveInt,
  revalidateAllCmsPages,
  readJsonBody,
} from '../_utils'
import { isValidNavUrl } from '../../../../lib/linkValidation'
import { wouldCreateMenuCycle } from '../../../../lib/menuTree'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')
  const wantsInactive = searchParams.get('include_inactive') === '1'
  const adminAccess = wantsInactive
    ? await getOptionalAdminContext(request, { resource: 'menus', action: 'read' })
    : { context: null, response: null }
  if (adminAccess.response) return adminAccess.response

  const includeInactive = Boolean(adminAccess.context)
  const limit = parsePositiveInt(searchParams.get('limit'), 500)
  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: includeInactive })
  if (response) return response

  let query = supabase
    .from('menus')
    .select('*')
    .order('menu_location', { ascending: true })
    .order('order_index', { ascending: true })
    .limit(limit || 500)

  if (location) query = query.eq('menu_location', location)
  if (!includeInactive) {
    query = query.eq('is_active', true).eq('status', 'published')
  }

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body?.title?.trim()) return jsonError('Menu label is required.', 400)
  if (!body?.url?.trim()) return jsonError('A destination (URL) is required.', 400)
  if (!isValidNavUrl(body.url)) {
    return jsonError('Enter a valid destination - a path starting with / or a full https:// URL.', 400)
  }

  const menuLocation = body.menu_location || 'header'
  const parentId = body.parent_id || null

  if (parentId) {
    if (parentId === body.id) {
      return jsonError('A menu item cannot be its own parent.', 400)
    }
    const { data: siblings, error: siblingsError } = await supabase
      .from('menus')
      .select('id, parent_id, menu_location')
      .eq('menu_location', menuLocation)
    if (siblingsError) return jsonError(`Failed to validate menu hierarchy: ${siblingsError.message}`, 500)

    const parentRow = siblings?.find((row) => row.id === parentId)
    if (!parentRow) {
      return jsonError('The selected parent menu item was not found in this menu.', 400)
    }
    if (body.id && wouldCreateMenuCycle(siblings, body.id, parentId)) {
      return jsonError('That parent would create a circular menu, or nest too deeply.', 400)
    }
  }

  const payload = {
    id: body.id || undefined,
    menu_location: menuLocation,
    title: body.title.trim(),
    url: body.url.trim(),
    order_index: parsePositiveInt(body.order_index, 0),
    parent_id: parentId,
    target: body.target === '_blank' ? '_blank' : '_self',
    is_active: body.is_active !== false,
    icon: body.icon ? String(body.icon).trim().slice(0, 50) : null,
    description: body.description ? String(body.description).trim().slice(0, 300) : null,
    desktop_visible: body.desktop_visible !== false,
    mobile_visible: body.mobile_visible !== false,
    status: body.status === 'draft' ? 'draft' : 'published',
  }

  const { data, error } = await supabase
    .from('menus')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save menu item: ${error.message}`, 500)
  revalidateAllCmsPages()
  return jsonOk(data)
}
