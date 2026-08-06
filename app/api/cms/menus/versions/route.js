import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')
  if (!location) return jsonError('location is required.', 400)

  const { data, error } = await supabase
    .from('menu_versions')
    .select('id, menu_location, label, created_at, created_by, snapshot')
    .eq('menu_location', location)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return jsonError(`Failed to load menu versions: ${error.message}`, 500)
  const withCounts = (data || []).map(({ snapshot, ...rest }) => ({
    ...rest,
    item_count: Array.isArray(snapshot) ? snapshot.length : 0,
  }))
  return jsonOk(withCounts)
}

// Snapshots the current full set of rows for a menu location, giving the admin a restore point
// (see .../[id]/restore/route.js). Called whenever the admin clicks "Publish" for a menu.
export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const menuLocation = body?.menu_location
  if (!menuLocation) return jsonError('menu_location is required.', 400)

  const { data: rows, error: rowsError } = await supabase
    .from('menus')
    .select('*')
    .eq('menu_location', menuLocation)
    .order('order_index', { ascending: true })
  if (rowsError) return jsonError(`Failed to load menu: ${rowsError.message}`, 500)

  const { data, error } = await supabase
    .from('menu_versions')
    .insert({
      menu_location: menuLocation,
      snapshot: rows || [],
      label: body?.label ? String(body.label).trim().slice(0, 120) : null,
    })
    .select('id, menu_location, label, created_at')
    .single()

  if (error) return jsonError(`Failed to save menu version: ${error.message}`, 500)
  return jsonOk({ ...data, item_count: (rows || []).length })
}
