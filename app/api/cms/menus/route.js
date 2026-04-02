import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  parsePositiveInt,
  revalidateAllCmsPages,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')
  const includeInactive = searchParams.get('include_inactive') === '1'
  const limit = parsePositiveInt(searchParams.get('limit'), 500)

  let query = supabase
    .from('menus')
    .select('*')
    .order('menu_location', { ascending: true })
    .order('order_index', { ascending: true })
    .limit(limit || 500)

  if (location) query = query.eq('menu_location', location)
  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 200, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const body = await readJsonBody(request)
  if (!body?.title || !body?.url) return jsonError('title and url are required.', 400)

  const payload = {
    id: body.id || undefined,
    menu_location: body.menu_location || 'header',
    title: body.title,
    url: body.url,
    order_index: parsePositiveInt(body.order_index, 0),
    parent_id: body.parent_id || null,
    target: body.target || '_self',
    is_active: body.is_active !== false,
  }

  const { data, error } = await supabase
    .from('menus')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save menu item: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}
